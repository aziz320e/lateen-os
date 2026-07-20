/** @module decision/types */
import type { ConfidenceScore } from '@lateen-os/institutional-memory';
import type { PriorityLevel } from '../priority/types.js';
import type { RiskLevel } from '../risk/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  AgentId,
  ApprovalFlowId,
  DecisionContextId,
  DecisionExecutionPlanId,
  DecisionId,
  EmployeeId,
  EvaluationResultId,
  OrganizationId,
  RecommendationId,
  RiskAssessmentId,
} from '../shared/identifiers.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';
import type { DecisionRequesterType } from '../shared/primitives.js';

export type { DecisionId };

export type DecisionCategory =
  | 'approval'
  | 'rejection'
  | 'prioritization'
  | 'escalation'
  | 'optimization'
  | 'resource_allocation'
  | 'policy_exception'
  | 'operational'
  | 'strategic';

export type DecisionStatus =
  | 'draft'
  | 'submitted'
  | 'evaluating'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'escalated'
  | 'executing'
  | 'completed'
  | 'cancelled'
  | 'archived';

/** Requester reference — AI agents may request, not decide. */
export interface DecisionRequester {
  readonly type: DecisionRequesterType;
  readonly employeeId?: EmployeeId;
  readonly agentId?: AgentId;
}

/**
 * Decision aggregate root — every business decision passes through the engine.
 * No AI agent may finalize a decision directly.
 */
export interface Decision extends TenantAuditableEntity<DecisionId> {
  readonly title: string;
  readonly description: string;
  readonly category: DecisionCategory;
  readonly status: DecisionStatus;
  readonly requestedBy: DecisionRequester;
  readonly requestedAt: Timestamp;
  readonly decidedAt?: Timestamp;
  readonly confidence: ConfidenceScore;
  readonly risk: RiskLevel;
  readonly priority: PriorityLevel;
  readonly contextId?: DecisionContextId;
  readonly evaluationResultId?: EvaluationResultId;
  readonly riskAssessmentId?: RiskAssessmentId;
  readonly recommendationId?: RecommendationId;
  readonly approvalFlowId?: ApprovalFlowId;
  readonly executionPlanId?: DecisionExecutionPlanId;
}

export type { OrganizationId };
