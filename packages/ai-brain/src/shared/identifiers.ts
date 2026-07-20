/** @module shared/identifiers */
import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type {
  AgentId,
  CustomerId,
  EmployeeId,
  OrganizationId,
  ProductId,
  ProjectId,
} from '@lateen-os/business-dna';

export type { GraphNodeId, GraphEdgeId } from '@lateen-os/domain-graph';
export type { KnowledgeEntryId, DecisionRecordId } from '@lateen-os/institutional-memory';
export type { DecisionId } from '@lateen-os/decision-engine';
export type { RuntimeAgentId, TaskId, ExecutionPlanId as RuntimeExecutionPlanId } from '@lateen-os/ai-runtime';
export type { WorkerId } from '@lateen-os/ai-workforce';
export type { WorkflowDefinitionId, WorkflowInstanceId } from '@lateen-os/workflow-engine';
export type { MissionId } from '@lateen-os/multi-agent';

/** AI Brain identifiers. */
export type BrainSessionId = Identifier;
export type IntentId = Identifier;
export type IntentEntityId = Identifier;
export type IntentParameterId = Identifier;
export type BrainExecutionPlanId = Identifier;
export type MissionPlanId = Identifier;
export type WorkflowPlanId = Identifier;
export type WorkerPlanId = Identifier;
export type ReasoningSessionId = Identifier;
export type ReasoningStepId = Identifier;
export type EnterpriseContextId = Identifier;
export type ConversationContextId = Identifier;
export type ServiceRouteId = Identifier;
export type WorkflowRouteId = Identifier;
export type MissionRouteId = Identifier;
export type WorkerRouteId = Identifier;
export type WorkingContextId = Identifier;
export type ReflectionSessionId = Identifier;
export type ValidationResultId = Identifier;
export type ExecutionGraphId = Identifier;
export type ExecutionNodeId = Identifier;
export type ExecutionEdgeId = Identifier;
export type ExecutionCheckpointId = Identifier;
