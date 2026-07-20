/** @module execution/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  DecisionExecutionPlanId,
  DecisionId,
  ExecutionStepId,
  OrganizationId,
} from '../shared/identifiers.js';

export type { DecisionExecutionPlanId, ExecutionStepId };

export type ExecutionPlanStatus = 'draft' | 'ready' | 'running' | 'completed' | 'failed' | 'rolled_back';

export type ExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/** Single step in a decision execution plan. */
export interface ExecutionStep {
  readonly stepId: ExecutionStepId;
  readonly order: number;
  readonly title: string;
  readonly description?: string;
  readonly status: ExecutionStepStatus;
}

/** Rollback procedure if execution fails. */
export interface RollbackPlan {
  readonly steps: readonly ExecutionStep[];
  readonly triggerCondition?: string;
}

/** Plan for executing an approved decision. */
export interface DecisionExecutionPlan extends TenantAuditableEntity<DecisionExecutionPlanId> {
  readonly decisionId: DecisionId;
  readonly steps: readonly ExecutionStep[];
  readonly rollbackPlan?: RollbackPlan;
  readonly status: ExecutionPlanStatus;
}

export type { OrganizationId };
