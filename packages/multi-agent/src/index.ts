/**
 * @lateen-os/multi-agent — Multi-Agent Collaboration Engine
 *
 * Coordination layer above AI Workforce. Allows multiple AI workers to cooperate
 * on a single business objective through missions, teams, negotiation, and consensus.
 *
 * Real, deterministic, in-memory implementations throughout — see
 * `runtime.ts`'s `createMultiAgentRuntime()` for the composition root, and
 * each module's `*.impl.ts` files. Integrates with AI Runtime (agent
 * registration cross-validation), AI Brain (escalation reasoning),
 * Workflow Engine (coordination-step execution), and Shared Kernel
 * (in-memory repositories, event bus) — see README.md.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';

export * as agent from './agent/index.js';
export * as session from './session/index.js';
export * as workingMemory from './working-memory/index.js';
export * as mission from './mission/index.js';
export * as team from './team/index.js';
export * as conversation from './conversation/index.js';
export * as delegation from './delegation/index.js';
export * as negotiation from './negotiation/index.js';
export * as consensus from './consensus/index.js';
export * as review from './review/index.js';
export * as escalation from './escalation/index.js';
export * as coordination from './coordination/index.js';
export * as conflict from './conflict/index.js';
export * as sharedContext from './shared-context/index.js';
export * as execution from './execution/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export type {
  Mission,
  MissionObjective,
  MissionPriority,
  MissionStatus,
  MissionContext,
  MissionId,
} from './mission/types.js';

export type {
  MissionTeam,
  MissionMember,
  MissionLeader,
  MissionRole,
  MissionTeamId,
} from './team/types.js';

export type {
  Conversation,
  Message,
  Discussion,
  DecisionProposal,
} from './conversation/types.js';

export type {
  DelegationRequest,
  DelegationResponse,
  DelegationPolicy,
} from './delegation/types.js';

export type {
  Negotiation,
  NegotiationRound,
  NegotiationOutcome,
} from './negotiation/types.js';

export type {
  ConsensusResult,
  VotingStrategy,
  Agreement,
} from './consensus/types.js';

export type {
  ReviewRequest,
  ReviewResult,
  ReviewComment,
} from './review/types.js';

export type {
  EscalationRequest,
  EscalationLevel,
  EscalationDecision,
} from './escalation/types.js';

export type {
  Coordinator,
  CoordinationPlan,
  CoordinationStep,
  CollaborationOrchestrator,
} from './coordination/types.js';

export type {
  SharedBusinessContext,
  SharedMemoryReference,
  SharedDecisionReference,
} from './shared-context/types.js';

export type {
  MissionExecution,
  ExecutionStage,
  ExecutionResult,
} from './execution/types.js';

export type { CollaborationQueries } from './queries/collaboration-queries.js';

export type { CollaborationDomainEvent } from './events/collaboration-events.js';
export { COLLABORATION_EVENT_NAMES } from './events/collaboration-events.js';

export type { OrganizationId, WorkerId, MissionWorkerRole } from './shared/index.js';

export type { MissionRepository } from './mission/repository.js';
export type { MissionTeamRepository } from './team/repository.js';
export type { ConversationRepository } from './conversation/repository.js';
export type { DelegationRequestRepository } from './delegation/repository.js';
export type { NegotiationRepository } from './negotiation/repository.js';
export type { ConsensusResultRepository } from './consensus/repository.js';
export type { ReviewRequestRepository } from './review/repository.js';
export type { EscalationRequestRepository } from './escalation/repository.js';
export type { CoordinatorRepository } from './coordination/repository.js';
export type { SharedBusinessContextRepository } from './shared-context/repository.js';
export type { MissionExecutionRepository } from './execution/repository.js';

export type { AgentDescriptor, AgentRegistration, AgentGroup } from './agent/types.js';
export type { AgentSession } from './session/types.js';
export type { SharedWorkingMemoryEntry } from './working-memory/types.js';
export type { Conflict, ConflictStatus, ConflictResolutionMethod } from './conflict/types.js';
export type { CoordinationPolicy } from './coordination/types.js';

// Real implementations — see each module's `.impl.ts` file.
export {
  createMultiAgentRuntime,
  type MultiAgentRuntime,
  type MultiAgentRuntimeDeps,
} from './runtime.js';
