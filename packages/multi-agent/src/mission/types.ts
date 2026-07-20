/** @module mission/types */
import type { ProjectId } from '@lateen-os/business-dna';
import type { DecisionId } from '@lateen-os/decision-engine';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { MissionId, MissionObjectiveId, OrganizationId } from '../shared/identifiers.js';
import type { MissionWorkerRole, ScoreValue, Timestamp } from '../shared/primitives.js';

export type MissionPriority = 'critical' | 'high' | 'medium' | 'low';

export type MissionStatus =
  | 'draft'
  | 'planning'
  | 'active'
  | 'negotiating'
  | 'awaiting_consensus'
  | 'awaiting_review'
  | 'escalated'
  | 'completed'
  | 'cancelled'
  | 'failed';

/** Business objective driving a multi-agent mission. */
export interface MissionObjective extends TenantAuditableEntity<MissionObjectiveId> {
  readonly missionId: MissionId;
  readonly title: string;
  readonly description: string;
  readonly measurableOutcome?: string;
  readonly targetScore?: ScoreValue;
  readonly dueAt?: Timestamp;
  readonly completedAt?: Timestamp;
}

/** Shared context envelope for a mission — references only, no persistence here. */
export interface MissionContext {
  readonly missionId: MissionId;
  readonly projectId?: ProjectId;
  readonly decisionIds: readonly DecisionId[];
  readonly businessDnaReferences: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
}

/** Top-level multi-agent collaboration unit aligned to a business objective. */
export interface Mission extends TenantAuditableEntity<MissionId> {
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly priority: MissionPriority;
  readonly status: MissionStatus;
  readonly objectiveIds: readonly MissionObjectiveId[];
  readonly context: MissionContext;
  readonly leadWorkerRole: MissionWorkerRole;
  readonly startedAt?: Timestamp;
  readonly completedAt?: Timestamp;
}

export type { MissionId, MissionObjectiveId, OrganizationId };
