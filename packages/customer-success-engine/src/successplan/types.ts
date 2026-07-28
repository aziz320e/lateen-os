/** @module successplan/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { PlanMilestoneId, PlanObjectiveId, PlanTaskId, SuccessPlanId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';

export type { PlanMilestoneId, PlanObjectiveId, PlanTaskId, SuccessPlanId };

export type SuccessPlanStatus = 'active' | 'completed' | 'cancelled';

/** A customer success plan — objectives, milestones, owners, and tasks toward a customer's goals. */
export interface SuccessPlan extends TenantAuditableEntity<SuccessPlanId> {
  readonly customerId: string;
  readonly name: string;
  /** Opaque foreign key — an HR Engine employee acting as plan owner. */
  readonly ownerId?: string;
  readonly status: SuccessPlanStatus;
  readonly currentVersion: number;
}

export type PlanObjectiveStatus = 'pending' | 'achieved';

export interface PlanObjective extends TenantAuditableEntity<PlanObjectiveId> {
  readonly planId: SuccessPlanId;
  readonly title: string;
  readonly description?: string;
  readonly status: PlanObjectiveStatus;
}

export type PlanMilestoneStatus = 'pending' | 'reached' | 'missed';

export interface PlanMilestone extends TenantAuditableEntity<PlanMilestoneId> {
  readonly planId: SuccessPlanId;
  readonly name: string;
  readonly targetDate: ISODate;
  readonly actualDate?: ISODate;
  readonly status: PlanMilestoneStatus;
}

export type PlanTaskStatus = 'pending' | 'in_progress' | 'completed';

export interface PlanTask extends TenantAuditableEntity<PlanTaskId> {
  readonly planId: SuccessPlanId;
  readonly title: string;
  /** Opaque foreign key — an HR Engine employee acting as task owner. */
  readonly ownerId?: string;
  readonly status: PlanTaskStatus;
}
