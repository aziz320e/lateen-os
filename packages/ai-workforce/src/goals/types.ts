/** @module goals/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  GoalId,
  KeyResultId,
  ObjectiveId,
  OrganizationId,
  TeamId,
  WorkerId,
} from '../shared/identifiers.js';
import type { ScoreValue, Timestamp } from '../shared/primitives.js';

export type { GoalId, ObjectiveId, KeyResultId };

export type GoalStatus = 'draft' | 'active' | 'at_risk' | 'completed' | 'cancelled' | 'archived';

export type GoalPeriod = 'weekly' | 'monthly' | 'quarterly' | 'annual';

/** Measurable key result within an objective. */
export interface KeyResult extends TenantAuditableEntity<KeyResultId> {
  readonly objectiveId: ObjectiveId;
  readonly title: string;
  readonly targetValue: ScoreValue;
  readonly currentValue: ScoreValue;
  readonly unit?: string;
  readonly dueAt?: Timestamp;
  readonly status: GoalStatus;
}

/** Objective grouping key results under a strategic aim. */
export interface Objective extends TenantAuditableEntity<ObjectiveId> {
  readonly goalId: GoalId;
  readonly title: string;
  readonly description?: string;
  readonly ownerWorkerId?: WorkerId;
  readonly ownerTeamId?: TeamId;
  readonly keyResultIds: readonly KeyResultId[];
  readonly status: GoalStatus;
}

/** Strategic goal for workers, teams, or the organization. */
export interface Goal extends TenantAuditableEntity<GoalId> {
  readonly title: string;
  readonly description?: string;
  readonly period: GoalPeriod;
  readonly status: GoalStatus;
  readonly ownerWorkerId?: WorkerId;
  readonly ownerTeamId?: TeamId;
  readonly objectiveIds: readonly ObjectiveId[];
  readonly startsAt: Timestamp;
  readonly endsAt: Timestamp;
}

export type { OrganizationId, WorkerId, TeamId };
