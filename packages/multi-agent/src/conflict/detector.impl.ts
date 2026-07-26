/**
 * Real Conflict Detection — two or more competing `'submitted'` proposals
 * in the same discussion (or, absent a discussion, the same conversation)
 * are a conflict requiring resolution.
 *
 * @module conflict/detector.impl
 */
import type { DecisionProposalRepository } from '../conversation/repository.js';
import type { CollaborationConversationId, DiscussionId } from '../conversation/types.js';
import type { CollaborationEventBus } from '../events/collaboration-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { ConflictRepository } from './repository.js';
import type { Conflict } from './types.js';

export interface ConflictDetector {
  /** Detects a conflict for the given scope. Returns `null` when fewer than two competing proposals exist. */
  detect(organizationId: OrganizationId, missionId: MissionId, conversationId: CollaborationConversationId, discussionId?: DiscussionId): Promise<Conflict | null>;
}

/** Creates a real {@link ConflictDetector}. */
export function createConflictDetector(
  proposalRepository: DecisionProposalRepository,
  conflictRepository: ConflictRepository,
  eventBus?: CollaborationEventBus,
): ConflictDetector {
  return {
    async detect(organizationId, missionId, conversationId, discussionId) {
      const candidates = discussionId
        ? await proposalRepository.findByDiscussion(organizationId, discussionId)
        : await proposalRepository.findByConversation(organizationId, conversationId);
      const competing = candidates.filter((proposal) => proposal.status === 'submitted');

      if (competing.length < 2) return null;

      const now = nowIso();
      const conflict: Conflict = {
        id: generateId('conflict'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        missionId,
        conversationId,
        discussionId,
        competingProposalIds: competing.map((proposal) => proposal.id),
        status: 'detected',
        detectedAt: now,
      };
      await conflictRepository.save(conflict);
      eventBus?.publish('conflict.detected', { conflictId: conflict.id, missionId, competingProposalCount: competing.length });
      return conflict;
    },
  };
}
