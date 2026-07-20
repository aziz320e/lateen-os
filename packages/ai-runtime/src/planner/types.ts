/** @module planner/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, PlanId, RuntimeAgentId, TaskId } from '../shared/identifiers.js';

export type { PlanId };

export type PlanStepStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed';

/** Single step within an execution plan. */
export interface PlanStep {
  readonly order: number;
  readonly label: string;
  readonly description?: string;
  readonly status: PlanStepStatus;
}

/** Structured plan produced by the planner for a task. */
export interface Plan extends TenantAuditableEntity<PlanId> {
  readonly taskId: TaskId;
  readonly runtimeAgentId: RuntimeAgentId;
  readonly steps: readonly PlanStep[];
}

export type { OrganizationId };
