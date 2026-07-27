/**
 * Real Knowledge Relationships — related links, parent/child hierarchy,
 * and directed reference edges forming a dependency graph. Every write is
 * guarded against creating a cycle.
 *
 * @module knowledge/relationships.impl
 */
import type { InstitutionalMemoryEventBus } from '../events/institutional-memory-event-bus.js';
import { CircularRelationshipError, KnowledgeEntryNotFoundError } from '../shared/errors.js';
import type { KnowledgeEntryId, OrganizationId } from '../shared/identifiers.js';
import type { KnowledgeRelationshipEdge } from './value-objects.js';
import type { KnowledgeEntryRepository } from './repository.js';
import type { KnowledgeEntry } from './types.js';

export interface DependencyGraph {
  readonly nodes: readonly KnowledgeEntryId[];
  readonly edges: readonly KnowledgeRelationshipEdge[];
}

export interface KnowledgeRelationshipService {
  addRelated(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId, relatedKnowledgeEntryId: KnowledgeEntryId): Promise<KnowledgeEntry>;
  setParent(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId, parentKnowledgeEntryId: KnowledgeEntryId): Promise<KnowledgeEntry>;
  addReference(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId, referenceId: KnowledgeEntryId): Promise<KnowledgeEntry>;
  getChildren(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId): Promise<readonly KnowledgeEntry[]>;
  /** Immediate parent up to root, cycle-safe. Excludes the starting entry. */
  getAncestry(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId): Promise<readonly KnowledgeEntry[]>;
  getDependencyGraph(organizationId: OrganizationId): Promise<DependencyGraph>;
}

/** Creates a real {@link KnowledgeRelationshipService} over a {@link KnowledgeEntryRepository}. */
export function createKnowledgeRelationshipService(
  repository: KnowledgeEntryRepository,
  eventBus?: InstitutionalMemoryEventBus,
): KnowledgeRelationshipService {
  async function requireEntry(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId): Promise<KnowledgeEntry> {
    const entry = await repository.findById(organizationId, knowledgeEntryId);
    if (!entry) throw new KnowledgeEntryNotFoundError(knowledgeEntryId);
    return entry;
  }

  async function parentChainWouldCycle(
    organizationId: OrganizationId,
    knowledgeEntryId: KnowledgeEntryId,
    candidateParentId: KnowledgeEntryId,
  ): Promise<boolean> {
    let current: KnowledgeEntryId | undefined = candidateParentId;
    const visited = new Set<KnowledgeEntryId>();
    while (current) {
      if (current === knowledgeEntryId) return true;
      if (visited.has(current)) break;
      visited.add(current);
      const entry: KnowledgeEntry | null = await repository.findById(organizationId, current);
      current = entry?.parentKnowledgeEntryId;
    }
    return false;
  }

  async function referenceGraphWouldCycle(
    organizationId: OrganizationId,
    knowledgeEntryId: KnowledgeEntryId,
    candidateReferenceId: KnowledgeEntryId,
  ): Promise<boolean> {
    const visited = new Set<KnowledgeEntryId>();
    const stack: KnowledgeEntryId[] = [candidateReferenceId];
    while (stack.length > 0) {
      const current = stack.pop() as KnowledgeEntryId;
      if (current === knowledgeEntryId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      const entry = await repository.findById(organizationId, current);
      if (entry) stack.push(...entry.referenceIds);
    }
    return false;
  }

  return {
    async addRelated(organizationId, knowledgeEntryId, relatedKnowledgeEntryId) {
      if (knowledgeEntryId === relatedKnowledgeEntryId) {
        throw new CircularRelationshipError(knowledgeEntryId);
      }
      const entry = await requireEntry(organizationId, knowledgeEntryId);
      const related = await requireEntry(organizationId, relatedKnowledgeEntryId);

      if (!entry.relatedKnowledgeEntryIds.includes(relatedKnowledgeEntryId)) {
        await repository.save({
          ...entry,
          relatedKnowledgeEntryIds: [...entry.relatedKnowledgeEntryIds, relatedKnowledgeEntryId],
        });
      }
      if (!related.relatedKnowledgeEntryIds.includes(knowledgeEntryId)) {
        await repository.save({
          ...related,
          relatedKnowledgeEntryIds: [...related.relatedKnowledgeEntryIds, knowledgeEntryId],
        });
      }
      eventBus?.publish('knowledge.relationship.created', {
        knowledgeEntryId,
        organizationId,
        relatedKnowledgeEntryId,
        relationshipType: 'related',
      });
      return (await repository.findById(organizationId, knowledgeEntryId)) as KnowledgeEntry;
    },

    async setParent(organizationId, knowledgeEntryId, parentKnowledgeEntryId) {
      if (knowledgeEntryId === parentKnowledgeEntryId) {
        throw new CircularRelationshipError(knowledgeEntryId);
      }
      const entry = await requireEntry(organizationId, knowledgeEntryId);
      await requireEntry(organizationId, parentKnowledgeEntryId);
      if (await parentChainWouldCycle(organizationId, knowledgeEntryId, parentKnowledgeEntryId)) {
        throw new CircularRelationshipError(knowledgeEntryId);
      }
      const updated: KnowledgeEntry = { ...entry, parentKnowledgeEntryId };
      await repository.save(updated);
      eventBus?.publish('knowledge.relationship.created', {
        knowledgeEntryId,
        organizationId,
        relatedKnowledgeEntryId: parentKnowledgeEntryId,
        relationshipType: 'parent_child',
      });
      return updated;
    },

    async addReference(organizationId, knowledgeEntryId, referenceId) {
      if (knowledgeEntryId === referenceId) {
        throw new CircularRelationshipError(knowledgeEntryId);
      }
      const entry = await requireEntry(organizationId, knowledgeEntryId);
      await requireEntry(organizationId, referenceId);
      if (await referenceGraphWouldCycle(organizationId, knowledgeEntryId, referenceId)) {
        throw new CircularRelationshipError(knowledgeEntryId);
      }
      const updated: KnowledgeEntry = entry.referenceIds.includes(referenceId)
        ? entry
        : { ...entry, referenceIds: [...entry.referenceIds, referenceId] };
      await repository.save(updated);
      eventBus?.publish('knowledge.relationship.created', {
        knowledgeEntryId,
        organizationId,
        relatedKnowledgeEntryId: referenceId,
        relationshipType: 'reference',
      });
      return updated;
    },

    async getChildren(organizationId, knowledgeEntryId) {
      const all = await repository.findByOrganization(organizationId);
      return all.filter((entry) => entry.parentKnowledgeEntryId === knowledgeEntryId);
    },

    async getAncestry(organizationId, knowledgeEntryId) {
      const entry = await requireEntry(organizationId, knowledgeEntryId);
      const ancestry: KnowledgeEntry[] = [];
      const visited = new Set<KnowledgeEntryId>([knowledgeEntryId]);
      let currentParentId = entry.parentKnowledgeEntryId;
      while (currentParentId && !visited.has(currentParentId)) {
        visited.add(currentParentId);
        const parent = await repository.findById(organizationId, currentParentId);
        if (!parent) break;
        ancestry.push(parent);
        currentParentId = parent.parentKnowledgeEntryId;
      }
      return ancestry;
    },

    async getDependencyGraph(organizationId) {
      const all = await repository.findByOrganization(organizationId);
      const edges: KnowledgeRelationshipEdge[] = [];
      for (const entry of all) {
        for (const referenceId of entry.referenceIds) {
          edges.push({ fromKnowledgeEntryId: entry.id, toKnowledgeEntryId: referenceId, relationshipType: 'reference' });
        }
      }
      return { nodes: all.map((entry) => entry.id), edges };
    },
  };
}
