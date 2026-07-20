/** @module performance/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  PerformanceMetricsId,
  TaskId,
  WorkerId,
} from '../shared/identifiers.js';
import type { ScoreValue, Timestamp } from '../shared/primitives.js';

export type { PerformanceMetricsId };

export type PerformancePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

/** Aggregate performance metrics for a worker over a period. */
export interface PerformanceMetrics extends TenantAuditableEntity<PerformanceMetricsId> {
  readonly workerId: WorkerId;
  readonly period: PerformancePeriod;
  readonly periodStart: Timestamp;
  readonly periodEnd: Timestamp;
  readonly tasksCompleted: number;
  readonly tasksFailed: number;
  readonly averageCompletionMinutes: ScoreValue;
  readonly goalCompletionRate: ScoreValue;
  readonly delegationSuccessRate: ScoreValue;
  readonly supervisorReviewScore: ScoreValue;
}

/** Composite workforce score for ranking and review. */
export interface WorkerScore {
  readonly workerId: WorkerId;
  readonly overallScore: ScoreValue;
  readonly productivityScore: ScoreValue;
  readonly qualityScore: ScoreValue;
  readonly collaborationScore: ScoreValue;
  readonly governanceScore: ScoreValue;
  readonly calculatedAt: Timestamp;
}

/** Task execution statistics for a worker. */
export interface TaskStatistics {
  readonly workerId: WorkerId;
  readonly totalAssigned: number;
  readonly totalCompleted: number;
  readonly totalFailed: number;
  readonly totalCancelled: number;
  readonly averageDurationMinutes: ScoreValue;
  readonly recentTaskIds: readonly TaskId[];
  readonly calculatedAt: Timestamp;
}

export type { OrganizationId, WorkerId, TaskId };
