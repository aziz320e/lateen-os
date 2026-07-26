/**
 * Real Shared Context service — a versioned business-context snapshot
 * accessible to every mission participant, distinct from the lighter,
 * per-key Shared Working Memory.
 *
 * @module shared-context/service.impl
 */
import type { DecisionId } from '@lateen-os/decision-engine';
import type { KnowledgeEntryId } from '@lateen-os/institutional-memory';
import { NotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type {
  SharedBusinessContextRepository,
  SharedDecisionReferenceRepository,
  SharedMemoryReferenceRepository,
} from './repository.js';
import type { SharedBusinessContext, SharedBusinessContextId } from './types.js';

export interface SharedContextService {
  create(organizationId: OrganizationId, missionId: MissionId, title: string): Promise<SharedBusinessContext>;
  addMemoryReference(organizationId: OrganizationId, contextId: SharedBusinessContextId, knowledgeEntryId: KnowledgeEntryId, label: string): Promise<SharedBusinessContext>;
  addDecisionReference(organizationId: OrganizationId, contextId: SharedBusinessContextId, decisionId: DecisionId, summary: string): Promise<SharedBusinessContext>;
  updateSnapshot(organizationId: OrganizationId, contextId: SharedBusinessContextId, snapshot: Readonly<Record<string, unknown>>): Promise<SharedBusinessContext>;
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<SharedBusinessContext | null>;
}

/** Creates a real {@link SharedContextService}. */
export function createSharedContextService(
  contextRepository: SharedBusinessContextRepository,
  memoryReferenceRepository: SharedMemoryReferenceRepository,
  decisionReferenceRepository: SharedDecisionReferenceRepository,
): SharedContextService {
  async function requireContext(organizationId: OrganizationId, contextId: SharedBusinessContextId): Promise<SharedBusinessContext> {
    const context = await contextRepository.findById(organizationId, contextId);
    if (!context) throw new NotFoundError('SharedBusinessContext', contextId);
    return context;
  }

  return {
    async create(organizationId, missionId, title) {
      const now = nowIso();
      const context: SharedBusinessContext = {
        id: generateId('shared-context'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        missionId,
        title,
        memoryReferenceIds: [],
        decisionReferenceIds: [],
        snapshot: {},
        version: 1,
      };
      await contextRepository.save(context);
      return context;
    },

    async addMemoryReference(organizationId, contextId, knowledgeEntryId, label) {
      const context = await requireContext(organizationId, contextId);
      const now = nowIso();
      const reference = { id: generateId('shared-memory-ref'), organizationId, createdAt: now, updatedAt: now, contextId, knowledgeEntryId, label, sharedAt: now };
      await memoryReferenceRepository.save(reference);
      const updated: SharedBusinessContext = {
        ...context,
        memoryReferenceIds: [...context.memoryReferenceIds, reference.id],
        version: context.version + 1,
        updatedAt: now,
      };
      await contextRepository.save(updated);
      return updated;
    },

    async addDecisionReference(organizationId, contextId, decisionId, summary) {
      const context = await requireContext(organizationId, contextId);
      const now = nowIso();
      const reference = { id: generateId('shared-decision-ref'), organizationId, createdAt: now, updatedAt: now, contextId, decisionId, summary, sharedAt: now };
      await decisionReferenceRepository.save(reference);
      const updated: SharedBusinessContext = {
        ...context,
        decisionReferenceIds: [...context.decisionReferenceIds, reference.id],
        version: context.version + 1,
        updatedAt: now,
      };
      await contextRepository.save(updated);
      return updated;
    },

    async updateSnapshot(organizationId, contextId, snapshot) {
      const context = await requireContext(organizationId, contextId);
      const updated: SharedBusinessContext = {
        ...context,
        snapshot: { ...context.snapshot, ...snapshot },
        version: context.version + 1,
        updatedAt: nowIso(),
      };
      await contextRepository.save(updated);
      return updated;
    },

    async findByMission(organizationId, missionId) {
      return contextRepository.findByMission(organizationId, missionId);
    },
  };
}
