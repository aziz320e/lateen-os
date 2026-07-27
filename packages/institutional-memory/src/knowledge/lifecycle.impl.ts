/**
 * Real Knowledge (Memory) Lifecycle — the KnowledgeEntry aggregate's
 * guarded state machine, plus immutable version history with author
 * tracking and rollback support.
 *
 * @module knowledge/lifecycle.impl
 */
import type { MemoryCategory, ImportanceLevel, RetentionPolicy, Visibility } from '../classification/types.js';
import type { ConfidenceScore } from '../confidence/types.js';
import type { InstitutionalMemoryEventBus } from '../events/institutional-memory-event-bus.js';
import {
  InvalidKnowledgeTransitionError,
  KnowledgeEntryNotFoundError,
  KnowledgeEntryVersionNotFoundError,
} from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { EmployeeId, KnowledgeEntryId, OrganizationId } from '../shared/identifiers.js';
import type { MemorySourceLabel, MemoryTag } from '../shared/primitives.js';
import type { KnowledgeEntryRepository, KnowledgeEntryVersionRepository } from './repository.js';
import type { KnowledgeEntry, KnowledgeEntryStatus, KnowledgeEntryVersion, KnowledgeType } from './types.js';

const KNOWLEDGE_TRANSITIONS: Readonly<Record<KnowledgeEntryStatus, readonly KnowledgeEntryStatus[]>> = {
  draft: ['published', 'review', 'archived'],
  published: ['review', 'archived'],
  review: ['published', 'archived'],
  archived: ['draft'],
};

export function canTransitionKnowledge(from: KnowledgeEntryStatus, to: KnowledgeEntryStatus): boolean {
  return KNOWLEDGE_TRANSITIONS[from].includes(to);
}

export interface CreateKnowledgeEntryInput {
  readonly title: string;
  readonly content: string;
  readonly knowledgeType: KnowledgeType;
  readonly category: MemoryCategory;
  readonly importance?: ImportanceLevel;
  readonly confidence?: ConfidenceScore;
  readonly visibility?: Visibility;
  readonly source: MemorySourceLabel;
  readonly tags?: readonly MemoryTag[];
  readonly ownerId?: EmployeeId;
  readonly retentionPolicy?: RetentionPolicy;
  readonly expiresAt?: string;
  readonly reviewDueAt?: string;
  readonly authorId?: EmployeeId;
}

export interface UpdateKnowledgeEntryInput {
  readonly title?: string;
  readonly content?: string;
  readonly category?: MemoryCategory;
  readonly importance?: ImportanceLevel;
  readonly confidence?: ConfidenceScore;
  readonly visibility?: Visibility;
  readonly tags?: readonly MemoryTag[];
  readonly ownerId?: EmployeeId;
  readonly retentionPolicy?: RetentionPolicy;
  readonly expiresAt?: string;
  readonly reviewDueAt?: string;
  readonly authorId?: EmployeeId;
  readonly changeSummary?: string;
}

export interface KnowledgeLifecycle {
  create(organizationId: OrganizationId, input: CreateKnowledgeEntryInput): Promise<KnowledgeEntry>;
  update(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId, patch: UpdateKnowledgeEntryInput): Promise<KnowledgeEntry>;
  archive(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId): Promise<KnowledgeEntry>;
  restore(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId): Promise<KnowledgeEntry>;
  requestReview(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId, reason?: string): Promise<KnowledgeEntry>;
  rollback(
    organizationId: OrganizationId,
    knowledgeEntryId: KnowledgeEntryId,
    toRevisionNumber: number,
    authorId?: EmployeeId,
  ): Promise<KnowledgeEntry>;
  transition(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId, to: KnowledgeEntryStatus): Promise<KnowledgeEntry>;
  getVersionHistory(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId): Promise<readonly KnowledgeEntryVersion[]>;
  get(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId): Promise<KnowledgeEntry | null>;
}

/** Creates a real {@link KnowledgeLifecycle} over a {@link KnowledgeEntryRepository} and {@link KnowledgeEntryVersionRepository}. */
export function createKnowledgeLifecycle(
  repository: KnowledgeEntryRepository,
  versionRepository: KnowledgeEntryVersionRepository,
  eventBus?: InstitutionalMemoryEventBus,
  now: () => string = nowIso,
): KnowledgeLifecycle {
  async function requireEntry(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId): Promise<KnowledgeEntry> {
    const entry = await repository.findById(organizationId, knowledgeEntryId);
    if (!entry) throw new KnowledgeEntryNotFoundError(knowledgeEntryId);
    return entry;
  }

  async function saveVersion(entry: KnowledgeEntry, authorId: EmployeeId | undefined, changeSummary: string | undefined): Promise<void> {
    const version: KnowledgeEntryVersion = {
      id: generateId('knowledge-version'),
      knowledgeEntryId: entry.id,
      organizationId: entry.organizationId,
      revisionNumber: entry.currentVersion,
      title: entry.title,
      content: entry.content,
      authorId,
      changeSummary,
      createdAt: now(),
    };
    await versionRepository.save(version);
    eventBus?.publish('knowledge.version.created', {
      knowledgeEntryId: entry.id,
      organizationId: entry.organizationId,
      revisionNumber: version.revisionNumber,
    });
  }

  async function transition(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId, to: KnowledgeEntryStatus): Promise<KnowledgeEntry> {
    const entry = await requireEntry(organizationId, knowledgeEntryId);
    if (!canTransitionKnowledge(entry.status, to)) {
      throw new InvalidKnowledgeTransitionError(knowledgeEntryId, entry.status, to);
    }
    const updated: KnowledgeEntry = { ...entry, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const entry: KnowledgeEntry = {
        id: generateId('knowledge'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        title: input.title,
        content: input.content,
        knowledgeType: input.knowledgeType,
        category: input.category,
        importance: input.importance ?? 'medium',
        confidence: input.confidence ?? '50',
        visibility: input.visibility ?? 'organization',
        source: input.source,
        tags: input.tags ?? [],
        status: 'draft',
        currentVersion: 1,
        ownerId: input.ownerId,
        retentionPolicy: input.retentionPolicy,
        expiresAt: input.expiresAt,
        reviewDueAt: input.reviewDueAt,
        relatedKnowledgeEntryIds: [],
        referenceIds: [],
      };
      await repository.save(entry);
      eventBus?.publish('knowledge.created', {
        knowledgeEntryId: entry.id,
        organizationId,
        title: entry.title,
        knowledgeType: entry.knowledgeType,
      });
      await saveVersion(entry, input.authorId, 'Initial version');
      return entry;
    },

    async update(organizationId, knowledgeEntryId, patch) {
      const entry = await requireEntry(organizationId, knowledgeEntryId);
      if (entry.status === 'archived') {
        throw new InvalidKnowledgeTransitionError(knowledgeEntryId, entry.status, 'updated');
      }
      const contentChanged =
        (patch.title !== undefined && patch.title !== entry.title) || (patch.content !== undefined && patch.content !== entry.content);

      const updated: KnowledgeEntry = {
        ...entry,
        title: patch.title ?? entry.title,
        content: patch.content ?? entry.content,
        category: patch.category ?? entry.category,
        importance: patch.importance ?? entry.importance,
        confidence: patch.confidence ?? entry.confidence,
        visibility: patch.visibility ?? entry.visibility,
        tags: patch.tags ?? entry.tags,
        ownerId: patch.ownerId ?? entry.ownerId,
        retentionPolicy: patch.retentionPolicy ?? entry.retentionPolicy,
        expiresAt: patch.expiresAt ?? entry.expiresAt,
        reviewDueAt: patch.reviewDueAt ?? entry.reviewDueAt,
        currentVersion: contentChanged ? entry.currentVersion + 1 : entry.currentVersion,
        updatedAt: now(),
      };
      await repository.save(updated);
      if (contentChanged) {
        await saveVersion(updated, patch.authorId, patch.changeSummary);
      }
      eventBus?.publish('knowledge.updated', { knowledgeEntryId, organizationId });
      return updated;
    },

    async archive(organizationId, knowledgeEntryId) {
      const archived = await transition(organizationId, knowledgeEntryId, 'archived');
      eventBus?.publish('knowledge.archived', { knowledgeEntryId, organizationId });
      return archived;
    },

    async restore(organizationId, knowledgeEntryId) {
      const restored = await transition(organizationId, knowledgeEntryId, 'draft');
      eventBus?.publish('knowledge.restored', { knowledgeEntryId, organizationId });
      return restored;
    },

    async requestReview(organizationId, knowledgeEntryId, reason) {
      const reviewed = await transition(organizationId, knowledgeEntryId, 'review');
      eventBus?.publish('knowledge.review.required', { knowledgeEntryId, organizationId, reason });
      return reviewed;
    },

    async rollback(organizationId, knowledgeEntryId, toRevisionNumber, authorId) {
      const entry = await requireEntry(organizationId, knowledgeEntryId);
      if (entry.status === 'archived') {
        throw new InvalidKnowledgeTransitionError(knowledgeEntryId, entry.status, 'updated');
      }
      const versions = await versionRepository.findByKnowledgeEntry(organizationId, knowledgeEntryId);
      const target = versions.find((version) => version.revisionNumber === toRevisionNumber);
      if (!target) throw new KnowledgeEntryVersionNotFoundError(knowledgeEntryId, toRevisionNumber);

      const updated: KnowledgeEntry = {
        ...entry,
        title: target.title,
        content: target.content,
        currentVersion: entry.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      await saveVersion(updated, authorId, `Rolled back to revision ${toRevisionNumber}`);
      eventBus?.publish('knowledge.updated', { knowledgeEntryId, organizationId });
      return updated;
    },

    transition,

    async getVersionHistory(organizationId, knowledgeEntryId) {
      return versionRepository.findByKnowledgeEntry(organizationId, knowledgeEntryId);
    },

    async get(organizationId, knowledgeEntryId) {
      return repository.findById(organizationId, knowledgeEntryId);
    },
  };
}
