/**
 * @lateen-os/decision-engine — Decision Engine
 *
 * Canonical decision layer for Lateen OS. No AI agent may make business
 * decisions directly — all recommendations pass through this engine.
 *
 * Real in-memory repositories and reasoning implementations (see
 * createReasoner, createConflictResolver, createContextResolver,
 * createDecisionResolver, createDecisionQueries). Deliberately
 * deterministic and rule-based, never LLM-driven.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';

export * as decision from './decision/index.js';
export * as context from './context/index.js';
export * as evaluation from './evaluation/index.js';
export * as policy from './policy/index.js';
export * as rule from './rule/index.js';
export * as reasoning from './reasoning/index.js';
export * as recommendation from './recommendation/index.js';
export * as approval from './approval/index.js';
export * as risk from './risk/index.js';
export * as priority from './priority/index.js';
export * as execution from './execution/index.js';
export * as queries from './queries/index.js';

export type { Decision, DecisionCategory, DecisionStatus } from './decision/types.js';
export type { DecisionContext } from './context/types.js';
export type {
  EvaluationResult,
  EvaluationCriteria,
  EvaluationScore,
} from './evaluation/types.js';
export type {
  DecisionPolicy,
  PolicyScope,
  PolicyConstraint,
  PolicyViolation,
} from './policy/types.js';
export type {
  DecisionRule,
  BusinessRule,
  TechnicalRule,
  ComplianceRule,
} from './rule/types.js';
export type {
  Recommendation,
  Alternative,
  RecommendationScore,
} from './recommendation/types.js';
export type { ApprovalFlow, ApprovalStep, Approver } from './approval/types.js';
export type { RiskAssessment, RiskFactor, RiskLevel } from './risk/types.js';
export type {
  PriorityScore,
  PriorityLevel,
  PriorityStrategy,
} from './priority/types.js';
export type {
  DecisionExecutionPlan,
  ExecutionStep,
  RollbackPlan,
} from './execution/types.js';

export type {
  Reasoner,
  ReasoningInput,
} from './reasoning/reasoner.js';
export { createReasoner } from './reasoning/reasoner.impl.js';
export type {
  DecisionResolver,
  DecisionResolution,
} from './reasoning/decision-resolver.js';
export { createDecisionResolver } from './reasoning/decision-resolver.impl.js';
export type {
  ConflictResolver,
  DecisionConflict,
  ConflictResolution,
} from './reasoning/conflict-resolver.js';
export { createConflictResolver } from './reasoning/conflict-resolver.impl.js';
export type {
  ContextResolver,
  DecisionContextResolveOptions,
} from './reasoning/context-resolver.js';
export {
  createContextResolver,
  type ContextResolverDeps,
} from './reasoning/context-resolver.impl.js';

export type { DecisionQueries } from './queries/decision-queries.js';
export {
  createDecisionQueries,
  type DecisionQueriesDeps,
} from './queries/decision-queries.impl.js';
export type { DecisionId, OrganizationId } from './shared/identifiers.js';

export type { DecisionRepository } from './decision/repository.js';
export { createDecisionRepository } from './decision/repository.impl.js';
export type { DecisionContextRepository } from './context/repository.js';
export { createDecisionContextRepository } from './context/repository.impl.js';
export type { EvaluationResultRepository } from './evaluation/repository.js';
export { createEvaluationResultRepository } from './evaluation/repository.impl.js';
export type { DecisionPolicyRepository } from './policy/repository.js';
export { createDecisionPolicyRepository } from './policy/repository.impl.js';
export {
  evaluatePolicyConstraints,
  evaluateExpression,
  type PolicyEvaluationOutcome,
} from './policy/policy-evaluator.js';
export type { DecisionRuleRepository } from './rule/repository.js';
export { createDecisionRuleRepository } from './rule/repository.impl.js';
export type { RecommendationRepository } from './recommendation/repository.js';
export { createRecommendationRepository } from './recommendation/repository.impl.js';
export type { ApprovalFlowRepository } from './approval/repository.js';
export { createApprovalFlowRepository } from './approval/repository.impl.js';
export type { RiskAssessmentRepository } from './risk/repository.js';
export { createRiskAssessmentRepository } from './risk/repository.impl.js';
export type { PriorityScoreRepository } from './priority/repository.js';
export { createPriorityScoreRepository } from './priority/repository.impl.js';
export type { DecisionExecutionPlanRepository } from './execution/repository.js';
export { createDecisionExecutionPlanRepository } from './execution/repository.impl.js';
