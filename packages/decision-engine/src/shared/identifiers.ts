/**
 * Identifier types for the Decision Engine bounded context.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type {
  AgentId,
  EmployeeId,
  KpiId,
  OrganizationId,
  PolicyId,
} from '@lateen-os/business-dna';

export type { CapabilityId } from '@lateen-os/capability-engine';

export type {
  GraphNodeId,
  GraphNodeType,
  GraphSnapshotId,
} from '@lateen-os/domain-graph';

export type {
  DecisionRecordId,
  InstitutionalMemoryId,
  KnowledgeEntryId,
} from '@lateen-os/institutional-memory';

/** Decision aggregate identifier. */
export type DecisionId = Identifier;

/** Decision context identifier. */
export type DecisionContextId = Identifier;

/** Evaluation result identifier. */
export type EvaluationResultId = Identifier;

/** Decision policy identifier. */
export type DecisionPolicyId = Identifier;

/** Decision rule identifier. */
export type DecisionRuleId = Identifier;

/** Recommendation identifier. */
export type RecommendationId = Identifier;

/** Approval flow identifier. */
export type ApprovalFlowId = Identifier;

/** Approval step identifier. */
export type ApprovalStepId = Identifier;

/** Risk assessment identifier. */
export type RiskAssessmentId = Identifier;

/** Priority score record identifier. */
export type PriorityScoreId = Identifier;

/** Decision execution plan identifier. */
export type DecisionExecutionPlanId = Identifier;

/** Execution step identifier. */
export type ExecutionStepId = Identifier;

/** Policy violation record identifier. */
export type PolicyViolationId = Identifier;

/** Metric snapshot identifier in decision context. */
export type MetricSnapshotId = Identifier;
