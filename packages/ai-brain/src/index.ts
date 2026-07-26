/**
 * @lateen-os/ai-brain — AI Brain
 *
 * Central enterprise reasoning layer for Lateen OS. Understands intent, reasons over
 * enterprise context, plans orchestration actions, and coordinates existing platform
 * services (AI Runtime, Workflow Engine, Multi-Agent).
 *
 * Contracts only — no LLM SDK, business logic, or persistence.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';

export * as intent from './intent/index.js';
export * as planner from './planner/index.js';
export * as reasoning from './reasoning/index.js';
export * as context from './context/index.js';
export * as routing from './routing/index.js';
export * as memory from './memory/index.js';
export * as reflection from './reflection/index.js';
export * as validation from './validation/index.js';
export * as executionPlan from './execution-plan/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export type {
  Intent,
  IntentType,
  IntentConfidence,
  IntentEntity,
  IntentParameter,
} from './intent/types.js';

export type {
  ExecutionPlan,
  MissionPlan,
  WorkflowPlan,
  WorkerPlan,
  BrainPlanStatus,
} from './planner/types.js';

export type {
  ReasoningContext,
} from './reasoning/context.js';

export type {
  ReasoningStep,
  ReasoningResult,
  ReasoningExplanation,
} from './reasoning/types.js';

export type {
  EnterpriseContext,
  BusinessContext,
  ConversationContext,
  MissionContext,
} from './context/types.js';

export type {
  ServiceRoute,
  WorkflowRoute,
  MissionRoute,
  WorkerRoute,
  RoutingDecision,
} from './routing/types.js';

export type {
  WorkingContext,
  RetrievedKnowledge,
  RelevantEntities,
} from './memory/types.js';

export type {
  ReflectionResult,
  SelfEvaluation,
  PlanImprovement,
} from './reflection/types.js';

export type {
  PermissionValidation,
  PolicyValidation,
  BusinessValidation,
  PlanValidationResult,
} from './validation/types.js';

export type {
  ExecutionGraph,
  ExecutionNode,
  ExecutionEdge,
  ExecutionCheckpoint,
} from './execution-plan/types.js';

export type { BrainQueries } from './queries/brain-queries.js';

export type {
  ExplainPlanQuery,
  ExplainPlanResult,
  ExplainDecisionQuery,
  ExplainDecisionResult,
  ExplainMissionQuery,
  ExplainMissionResult,
  FindRelevantKnowledgeQuery,
  FindRelevantKnowledgeResult,
} from './queries/types.js';

export type {
  BrainDomainEvent,
  IntentRecognized,
  PlanCreated,
  PlanRejected,
  ExecutionRequested,
  ReasoningCompleted,
} from './events/brain-events.js';

export { BRAIN_EVENT_NAMES } from './events/brain-events.js';

export type {
  Brain,
  BrainCapabilities,
  BrainSessionRequest,
  BrainSessionResponse,
} from './brain.js';

export type { IntentRecognizer } from './intent/recognizer.js';
export type { BrainPlanner } from './planner/planner.js';
export type { EnterpriseReasoner } from './reasoning/reasoner.js';
export type { EnterpriseContextAssembler } from './context/assembler.js';
export type { PlatformRouter } from './routing/router.js';
export type { WorkingMemory } from './memory/working-memory.js';
export type { BrainReflector } from './reflection/reflector.js';
export type { PlanValidator } from './validation/validator.js';

export type {
  BrainSessionId,
  IntentId,
  BrainExecutionPlanId,
  ReasoningSessionId,
  OrganizationId,
} from './shared/identifiers.js';

// Real implementations — see each module's `.impl.ts` file.
export { createIntentRecognizer } from './intent/recognizer.impl.js';
export { createEnterpriseContextAssembler, type EnterpriseContextAssemblerDeps } from './context/assembler.impl.js';
export { createWorkingMemory } from './memory/working-memory.impl.js';
export { createEnterpriseReasoner, type EnterpriseReasonerDeps } from './reasoning/reasoner.impl.js';
export { createPlatformRouter, type PlatformRouterDeps } from './routing/router.impl.js';
export { createBrainPlanner } from './planner/planner.impl.js';
export { createPlanValidator } from './validation/validator.impl.js';
export { createBrainReflector } from './reflection/reflector.impl.js';
export { createBrainQueries, type BrainQueriesDeps } from './queries/brain-queries.impl.js';
export {
  createReasoningSessionStore,
  type ReasoningSessionStore,
} from './reasoning/session-store.js';
export {
  createBrainEventBus,
  type BrainEventBus,
  type BrainEventMap,
} from './events/brain-event-bus.js';
export {
  createBrain,
  createBrainSystem,
  type BrainDeps,
  type BrainSystem,
} from './brain.impl.js';
export {
  PlanNotFoundError,
  DecisionExplanationNotFoundError,
  MissionExplanationNotFoundError,
} from './shared/errors.js';
