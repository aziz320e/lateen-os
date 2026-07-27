/**
 * @lateen-os/ai-governance-engine — AI Governance Engine
 *
 * Governance policies, AI/model/agent/workflow governance, the human
 * approval engine, risk governance, decision tracking, and the
 * governance rules engine for Lateen OS. Real, deterministic, offline
 * implementation — see `runtime.ts`'s `createGovernanceRuntime()` for
 * the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as policy from './policy/index.js';
export * as aiGovernance from './ai-governance/index.js';
export * as modelGovernance from './model-governance/index.js';
export * as agentGovernance from './agent-governance/index.js';
export * as workflowGovernance from './workflow-governance/index.js';
export * as approval from './approval/index.js';
export * as risk from './risk/index.js';
export * as decision from './decision/index.js';
export * as rulesEngine from './rules-engine/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createGovernanceRuntime,
  type GovernanceRuntime,
  type GovernanceRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { GovernancePolicy, GovernancePolicyType, GovernancePolicyStatus, GovernancePolicyVersion, GovernancePolicyId, PolicyVersionId } from './policy/types.js';
export type { AiGovernanceRecord, AiGovernanceTargetType, AiGovernanceStatus, AiGovernanceRecordId } from './ai-governance/types.js';
export type { ModelGovernanceRecord, ModelGovernanceStatus, ModelGovernanceRecordId } from './model-governance/types.js';
export type { AgentGovernanceRecord, AgentGovernanceStatus, AgentGovernanceRecordId } from './agent-governance/types.js';
export type { WorkflowGovernanceRecord, WorkflowGovernanceStatus, WorkflowGovernanceRecordId } from './workflow-governance/types.js';
export type { ApprovalRequest, ApprovalCategory, ApprovalStatus, GovernanceException, ApprovalRequestId, GovernanceExceptionId } from './approval/types.js';
export type { Risk, RiskLevel, RiskStatus, RiskId } from './risk/types.js';
export type { Decision, DecisionOutcome, DecisionId } from './decision/types.js';
export type {
  GovernanceRule,
  GovernanceRuleTarget,
  GovernanceRuleEffect,
  GovernanceRuleCondition,
  RuleConditionOperator,
  GovernanceRuleStatus,
  EvaluateGovernanceInput,
  GovernanceEvaluation,
  GovernanceRuleId,
} from './rules-engine/types.js';

/** Real lifecycle/service ports. */
export {
  type GovernancePolicyEngine,
  type CreatePolicyInput,
  type UpdatePolicyInput,
  canTransitionPolicy,
} from './policy/engine.impl.js';
export { type AiGovernanceService, type DecideAiGovernanceInput } from './ai-governance/service.impl.js';
export {
  type ModelGovernanceService,
  type ApproveModelInput,
  type DeprecateModelInput,
  canTransitionModel,
} from './model-governance/service.impl.js';
export {
  type AgentGovernanceService,
  type AgentGovernanceDeps,
  type AgentRuntimeRegistryPort,
  type RequestAgentRegistrationInput,
  canTransitionAgent,
} from './agent-governance/service.impl.js';
export {
  type WorkflowGovernanceService,
  type WorkflowGovernanceDeps,
  type WorkflowRuntimeQueriesPort,
  type RequestWorkflowApprovalInput,
  type SetVersionPolicyInput,
  type SetExecutionPolicyInput,
  type ExecutionPolicyCheck,
} from './workflow-governance/service.impl.js';
export {
  type ApprovalEngine,
  type RequestApprovalInput,
  type DecideApprovalInput,
} from './approval/service.impl.js';
export { type RiskRegister, type CreateRiskInput, canTransitionRisk } from './risk/service.impl.js';
export { type DecisionTrackingService, type RecordDecisionInput } from './decision/service.impl.js';
export {
  type GovernanceRulesEngine,
  type CreateGovernanceRuleInput,
  matchesConditions,
} from './rules-engine/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { GovernancePolicyRepository, GovernancePolicyVersionRepository } from './policy/repository.js';
export type { AiGovernanceRecordRepository } from './ai-governance/repository.js';
export type { ModelGovernanceRecordRepository } from './model-governance/repository.js';
export type { AgentGovernanceRecordRepository } from './agent-governance/repository.js';
export type { WorkflowGovernanceRecordRepository } from './workflow-governance/repository.js';
export type { ApprovalRequestRepository, GovernanceExceptionRepository } from './approval/repository.js';
export type { RiskRepository } from './risk/repository.js';
export type { DecisionRepository } from './decision/repository.js';
export type { GovernanceRuleRepository } from './rules-engine/repository.js';

/** Relationship Layer (AI Security Engine / AI Runtime / AI Brain / Workflow Engine / Business DNA / Communication Hub integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { GovernanceQueries } from './queries/governance-queries.js';

/** Typed event bus. */
export type { GovernanceDomainEvent } from './events/governance-events.js';
export { GOVERNANCE_EVENT_NAMES } from './events/governance-events.js';
