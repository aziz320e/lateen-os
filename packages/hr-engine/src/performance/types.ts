/** @module performance/types */
import type { EmployeeId } from '../employee/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { EvaluationId, ObjectiveId, ReviewPeriodId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';

export type { EvaluationId, ObjectiveId, ReviewPeriodId };

export type ReviewPeriodStatus = 'open' | 'closed';

export interface ReviewPeriod extends TenantAuditableEntity<ReviewPeriodId> {
  readonly name: string;
  readonly startDate: ISODate;
  readonly endDate: ISODate;
  readonly status: ReviewPeriodStatus;
}

export type ObjectiveStatus = 'in_progress' | 'completed' | 'missed';

export interface Objective extends TenantAuditableEntity<ObjectiveId> {
  readonly employeeId: EmployeeId;
  readonly reviewPeriodId: ReviewPeriodId;
  readonly description: string;
  /** Weight as a percentage string (e.g. `"25"`); every objective in one evaluation should sum to `100`. */
  readonly weightPct: string;
  readonly status: ObjectiveStatus;
}

/** A 1 (lowest) - 5 (highest) rating for one objective within an evaluation. */
export interface ObjectiveRating {
  readonly objectiveId: ObjectiveId;
  readonly rating: number;
}

export type EvaluationStatus = 'draft' | 'completed';

export interface Evaluation extends TenantAuditableEntity<EvaluationId> {
  readonly employeeId: EmployeeId;
  readonly reviewPeriodId: ReviewPeriodId;
  readonly objectiveRatings: readonly ObjectiveRating[];
  readonly overallRating: number;
  readonly promotionRecommended: boolean;
  readonly status: EvaluationStatus;
}
