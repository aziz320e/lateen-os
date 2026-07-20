/** @module coordination/types */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { WorkflowInstanceId } from '@lateen-os/workflow-engine';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  CoordinatorId,
  CoordinationPlanId,
  CoordinationStepId,
  EscalationRequestId,
  MissionExecutionId,
  MissionId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { MissionWorkerRole, Timestamp } from '../shared/primitives.js';

export type CoordinationStepStatus = 'pending' | 'ready' | 'running' | 'waiting' | 'completed' | 'failed' | 'skipped';

/** Single step in a coordination plan. */
export interface CoordinationStep extends TenantAuditableEntity<CoordinationStepId> {
  readonly planId: CoordinationPlanId;
  readonly sequence: number;
  readonly title: string;
  readonly assignedRole: MissionWorkerRole;
  readonly assignedWorkerId?: WorkerId;
  readonly workflowInstanceId?: WorkflowInstanceId;
  readonly status: CoordinationStepStatus;
  readonly dependsOnStepIds: readonly CoordinationStepId[];
}

/** Plan coordinating worker activities for a mission. */
export interface CoordinationPlan extends TenantAuditableEntity<CoordinationPlanId> {
  readonly missionId: MissionId;
  readonly name: string;
  readonly stepIds: readonly CoordinationStepId[];
  readonly active: boolean;
}

/** Coordinator responsible for orchestrating a mission team. */
export interface Coordinator extends TenantAuditableEntity<CoordinatorId> {
  readonly missionId: MissionId;
  readonly workerId: WorkerId;
  readonly role: MissionWorkerRole;
  readonly planId: CoordinationPlanId;
  readonly active: boolean;
}

/** Port for multi-agent orchestration — implementation lives outside this package. */
export interface CollaborationOrchestrator {
  startMission(missionId: MissionId): Promise<CoordinationPlanId>;
  assignWorker(missionId: MissionId, workerId: WorkerId, stepId: CoordinationStepId): Promise<void>;
  advanceStep(stepId: CoordinationStepId): Promise<CoordinationStepStatus>;
  escalate(missionId: MissionId, reason: string): Promise<EscalationRequestId>;
  completeMission(missionId: MissionId): Promise<MissionExecutionId>;
}

export type { CoordinatorId, CoordinationPlanId, CoordinationStepId, OrganizationId, WorkerId };
