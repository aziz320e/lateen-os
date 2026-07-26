/** @module shared/identifiers */
import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type {
  AgentId,
  OrganizationId,
  ProjectId,
} from '@lateen-os/business-dna';

export type { RuntimeAgentId, TaskId } from '@lateen-os/ai-runtime';
export type { WorkerId } from '@lateen-os/ai-workforce';
export type { DecisionId } from '@lateen-os/decision-engine';
export type { KnowledgeEntryId } from '@lateen-os/institutional-memory';
export type { WorkflowInstanceId } from '@lateen-os/workflow-engine';

/** Multi-agent collaboration identifiers. */
export type MissionId = Identifier;
export type MissionObjectiveId = Identifier;
export type MissionTeamId = Identifier;
export type MissionMemberId = Identifier;
export type CollaborationConversationId = Identifier;
export type CollaborationMessageId = Identifier;
export type DiscussionId = Identifier;
export type DecisionProposalId = Identifier;
export type CollaborationDelegationId = Identifier;
export type DelegationPolicyId = Identifier;
export type NegotiationId = Identifier;
export type NegotiationRoundId = Identifier;
export type ConsensusResultId = Identifier;
export type AgreementId = Identifier;
export type ReviewRequestId = Identifier;
export type ReviewResultId = Identifier;
export type ReviewCommentId = Identifier;
export type EscalationRequestId = Identifier;
export type EscalationDecisionId = Identifier;
export type CoordinatorId = Identifier;
export type CoordinationPlanId = Identifier;
export type CoordinationStepId = Identifier;
export type SharedBusinessContextId = Identifier;
export type SharedMemoryReferenceId = Identifier;
export type SharedDecisionReferenceId = Identifier;
export type MissionExecutionId = Identifier;
export type ExecutionStageId = Identifier;

/** Agent registry / directory / groups / sessions / working memory / conflicts / policies. */
export type AgentRegistrationId = Identifier;
export type AgentGroupId = Identifier;
export type AgentSessionId = Identifier;
export type SharedWorkingMemoryEntryId = Identifier;
export type ConflictId = Identifier;
export type CoordinationPolicyId = Identifier;
