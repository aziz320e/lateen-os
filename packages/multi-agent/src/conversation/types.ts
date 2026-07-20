/** @module conversation/types */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { DecisionId } from '@lateen-os/decision-engine';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  CollaborationConversationId,
  CollaborationMessageId,
  DecisionProposalId,
  DiscussionId,
  MissionId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

export type MessageType = 'statement' | 'question' | 'proposal' | 'response' | 'system';

export type DiscussionStatus = 'open' | 'resolved' | 'archived';

/** Single message in a multi-agent conversation. */
export interface Message extends TenantAuditableEntity<CollaborationMessageId> {
  readonly conversationId: CollaborationConversationId;
  readonly authorWorkerId: WorkerId;
  readonly type: MessageType;
  readonly content: string;
  readonly sentAt: Timestamp;
  readonly replyToMessageId?: CollaborationMessageId;
}

/** Threaded discussion within a mission conversation. */
export interface Discussion extends TenantAuditableEntity<DiscussionId> {
  readonly conversationId: CollaborationConversationId;
  readonly topic: string;
  readonly status: DiscussionStatus;
  readonly messageIds: readonly CollaborationMessageId[];
  readonly participantWorkerIds: readonly WorkerId[];
}

/** Proposal requiring team or Decision Engine resolution. */
export interface DecisionProposal extends TenantAuditableEntity<DecisionProposalId> {
  readonly conversationId: CollaborationConversationId;
  readonly proposerWorkerId: WorkerId;
  readonly title: string;
  readonly rationale: string;
  readonly proposedAction: string;
  readonly decisionId?: DecisionId;
  readonly status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'withdrawn';
}

/** Multi-agent conversation channel for a mission. */
export interface Conversation extends TenantAuditableEntity<CollaborationConversationId> {
  readonly missionId: MissionId;
  readonly title: string;
  readonly participantWorkerIds: readonly WorkerId[];
  readonly discussionIds: readonly DiscussionId[];
  readonly active: boolean;
}

export type {
  CollaborationConversationId,
  CollaborationMessageId,
  DecisionProposalId,
  DiscussionId,
  OrganizationId,
  WorkerId,
};
