/** @module conflict/types */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ConflictId, MissionId, OrganizationId } from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';
import type { CollaborationConversationId, DecisionProposalId, DiscussionId } from '../conversation/types.js';

export type { ConflictId, OrganizationId, WorkerId };

export type ConflictStatus = 'detected' | 'resolving' | 'resolved' | 'escalated';
export type ConflictResolutionMethod = 'consensus' | 'leader_decision' | 'escalation';

/** A detected conflict between two or more competing proposals in the same discussion. */
export interface Conflict extends TenantAuditableEntity<ConflictId> {
  readonly missionId: MissionId;
  readonly conversationId: CollaborationConversationId;
  readonly discussionId?: DiscussionId;
  readonly competingProposalIds: readonly DecisionProposalId[];
  readonly status: ConflictStatus;
  readonly detectedAt: Timestamp;
  readonly resolutionMethod?: ConflictResolutionMethod;
  readonly winningProposalId?: DecisionProposalId;
  readonly resolutionSummary?: string;
  readonly resolvedAt?: Timestamp;
}
