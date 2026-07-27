/** @module vision-mission/types */
import type { Entity } from '../shared/entity.js';
import type { OrganizationId, StrategicObjectiveId, VisionMissionId } from '../shared/identifiers.js';
import type { Auditable, ISODate, TenantScoped } from '../shared/primitives.js';

export type { VisionMissionId, StrategicObjectiveId };

export type StrategicObjectiveStatus = 'planned' | 'in_progress' | 'achieved' | 'abandoned';

/** A measurable strategic objective supporting the organization's mission. */
export interface StrategicObjective {
  readonly objectiveId: StrategicObjectiveId;
  readonly title: string;
  readonly description?: string;
  readonly targetDate?: ISODate;
  readonly status: StrategicObjectiveStatus;
}

/**
 * Vision & Mission — a singleton per organization holding the vision and
 * mission statements, core values, and strategic objectives.
 */
export interface VisionMission extends Entity<VisionMissionId>, TenantScoped, Auditable {
  readonly vision: string;
  readonly mission: string;
  readonly values: readonly string[];
  readonly strategicObjectives: readonly StrategicObjective[];
}

export type { OrganizationId };
