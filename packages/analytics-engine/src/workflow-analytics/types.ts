/** @module workflow-analytics/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { WorkflowAnalyticsId } from '../shared/identifiers.js';

export type { WorkflowAnalyticsId };

/** A single, deterministic workflow analytics snapshot. */
export interface WorkflowAnalyticsSnapshot extends TenantAuditableEntity<WorkflowAnalyticsId> {
  readonly activeWorkflows: number;
  readonly completedWorkflows: number;
  readonly failedWorkflows: number;
  readonly averageExecutionTimeMinutes: number;
  readonly bottlenecks: Readonly<Record<string, number>>;
  readonly computedAt: string;
}
