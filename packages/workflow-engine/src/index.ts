/**
 * @lateen-os/workflow-engine — Workflow Engine
 *
 * Canonical orchestration layer for Lateen OS. Coordinates humans, AI workers,
 * services, and business processes — does not execute business logic.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';

export * as workflow from './workflow/index.js';
export * as instance from './instance/index.js';
export * as step from './step/index.js';
export * as transition from './transition/index.js';
export * as trigger from './trigger/index.js';
export * as condition from './condition/index.js';
export * as action from './action/index.js';
export * as approval from './approval/index.js';
export * as execution from './execution/index.js';
export * as history from './history/index.js';
export * as templates from './templates/index.js';
export * as scheduler from './scheduler/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export type {
  WorkflowDefinition,
  WorkflowVersion,
  WorkflowMetadata,
  WorkflowDefinitionId,
} from './workflow/types.js';

export type {
  WorkflowInstance,
  WorkflowExecution,
  WorkflowStatus,
  WorkflowInstanceId,
} from './instance/types.js';

export type {
  WorkflowStep,
  HumanTask,
  AITask,
  ServiceTask,
  DecisionTask,
  StepInstance,
} from './step/types.js';

export type {
  Transition,
  ConditionalTransition,
  ParallelTransition,
} from './transition/types.js';

export type {
  ManualTrigger,
  ScheduledTrigger,
  EventTrigger,
} from './trigger/types.js';

export type { Expression, Rule, PolicyCondition } from './condition/types.js';

export type {
  NotificationAction,
  ServiceAction,
  AITaskAction,
  DecisionAction,
} from './action/types.js';

export type { ApprovalStep, Approver, ApprovalChain } from './approval/types.js';

export type {
  WorkflowOrchestrator,
  ExecutionCommand,
  ExecutionHandoff,
} from './execution/types.js';

export type {
  WorkflowHistory,
  ExecutionHistory,
  AuditTrail,
} from './history/types.js';

export type { WorkflowTemplate } from './templates/types.js';

export type { WorkflowSchedule } from './scheduler/types.js';

export type { WorkflowQueries } from './queries/workflow-queries.js';

export type { WorkflowEngineDomainEvent } from './events/workflow-events.js';

export type { OrganizationId } from './shared/identifiers.js';

export type { WorkflowDefinitionRepository } from './workflow/repository.js';
export type { WorkflowInstanceRepository } from './instance/repository.js';
export type { StepInstanceRepository } from './step/repository.js';
export type { ApprovalStepRepository } from './approval/repository.js';
export type { WorkflowHistoryRepository } from './history/repository.js';
export type { WorkflowTemplateRepository } from './templates/repository.js';
export type { WorkflowScheduleRepository } from './scheduler/repository.js';

// Additive type refinements needed by the real implementation below.
export type { WaitStep } from './step/types.js';
export type { RetryPolicy, RetryBackoffStrategy } from './execution/types.js';

// Real implementations — see each module's `.impl.ts` file.
export { createWorkflowDefinitionRepository, createWorkflowVersionRepository } from './workflow/repository.impl.js';
export { createWorkflowInstanceRepository, createWorkflowExecutionRepository } from './instance/repository.impl.js';
export { createStepInstanceRepository } from './step/repository.impl.js';
export { createApprovalStepRepository, createApprovalChainRepository } from './approval/repository.impl.js';
export {
  createWorkflowHistoryRepository,
  createExecutionHistoryRepository,
  createAuditTrailRepository,
} from './history/repository.impl.js';
export { createWorkflowTemplateRepository } from './templates/repository.impl.js';
export { createWorkflowScheduleRepository } from './scheduler/repository.impl.js';
export { createTriggerDefinitionRepository } from './trigger/repository.impl.js';
export {
  createExpressionRepository,
  createRuleRepository,
  createPolicyConditionRepository,
} from './condition/repository.impl.js';

export type { ConditionEvaluator } from './condition/evaluator.js';
export { createConditionEvaluator } from './condition/evaluator.impl.js';

export { computeRetryDelayMs, canRetry, runWithRetryPolicy, type RetryPolicyResult } from './execution/retry.js';

export {
  canTransitionWorkflow,
  transitionWorkflowInstance,
  canTransitionStep,
  transitionStepInstance,
} from './execution/state-machine.js';

export { resolveNextSteps, type NextStepsResolution, type ResolveNextStepsDeps } from './execution/transition-resolver.js';

export type { StepHandler, StepHandlerContext, StepHandlerResult } from './execution/step-handler.js';

export { createWorkflowOrchestrator, type WorkflowOrchestratorDeps } from './execution/orchestrator.impl.js';

export { createWorkflowQueries, type WorkflowQueriesDeps } from './queries/workflow-queries.impl.js';

export { createWorkflowEventBus, type WorkflowEventBus, type WorkflowEventMap } from './events/workflow-event-bus.js';

export {
  createWorkflowRuntime,
  type WorkflowRuntime,
  type WorkflowRuntimeDeps,
  type DefineWorkflowInput,
  type DefinedWorkflow,
  type StartWorkflowInput,
} from './runtime.js';

export {
  WorkflowDefinitionNotFoundError,
  WorkflowVersionNotFoundError,
  WorkflowInstanceNotFoundError,
  StepInstanceNotFoundError,
  WorkflowStepNotFoundError,
  InvalidWorkflowTransitionError,
  InvalidStepTransitionError,
  UnsupportedExpressionLanguageError,
  ConditionEvaluationError,
  WaitNotElapsedError,
  NoOutgoingTransitionError,
} from './shared/errors.js';
