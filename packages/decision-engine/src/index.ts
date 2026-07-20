/**
 * @lateen-os/decision-engine — Decision Engine
 *
 * Canonical decision layer for Lateen OS. No AI agent may make business
 * decisions directly — all recommendations pass through this engine.
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
export type {
  DecisionResolver,
  DecisionResolution,
} from './reasoning/decision-resolver.js';
export type {
  ConflictResolver,
  DecisionConflict,
  ConflictResolution,
} from './reasoning/conflict-resolver.js';
export type {
  ContextResolver,
  DecisionContextResolveOptions,
} from './reasoning/context-resolver.js';

export type { DecisionQueries } from './queries/decision-queries.js';
export type { DecisionId, OrganizationId } from './shared/identifiers.js';

export type { DecisionRepository } from './decision/repository.js';
export type { DecisionContextRepository } from './context/repository.js';
export type { EvaluationResultRepository } from './evaluation/repository.js';
export type { DecisionPolicyRepository } from './policy/repository.js';
export type { DecisionRuleRepository } from './rule/repository.js';
export type { RecommendationRepository } from './recommendation/repository.js';
export type { ApprovalFlowRepository } from './approval/repository.js';
export type { RiskAssessmentRepository } from './risk/repository.js';
export type { PriorityScoreRepository } from './priority/repository.js';
export type { DecisionExecutionPlanRepository } from './execution/repository.js';
