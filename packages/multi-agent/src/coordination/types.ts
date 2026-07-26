/** @module coordination/types */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { WorkflowInstanceId } from '@lateen-os/workflow-engine';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  CoordinatorId,
  CoordinationPlanId,
  CoordinationPolicyId,
  CoordinationStepId,
  EscalationRequestId,
  MissionExecutionId,
  MissionId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { MissionWorkerRole, Timestamp } from '../shared/primitives.js';
import type { VotingStrategy } from '../consensus/types.js';

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

/** Governs how a mission's coordinator resolves conflicts and delegates. */
export interface CoordinationPolicy extends TenantAuditableEntity<CoordinationPolicyId> {
  readonly missionId: MissionId;
  readonly defaultVotingStrategy: VotingStrategy;
  /** A consensus score below this triggers escalation instead of accepting the result. */
  readonly escalationThresholdScore: string;
  readonly maxDelegationDepth: number;
  /** Whether advancing a coordination step starts a real Workflow Engine instance. */
  readonly autoStartWorkflows: boolean;
}

/**
 * Port for multi-agent orchestration. Real implementation:
 * {@link createCollaborationOrchestrator}.
 */
export interface CollaborationOrchestrator {
  startMission(organizationId: OrganizationId, missionId: MissionId): Promise<CoordinationPlanId>;
  assignWorker(organizationId: OrganizationId, missionId: MissionId, workerId: WorkerId, stepId: CoordinationStepId): Promise<void>;
  advanceStep(organizationId: OrganizationId, stepId: CoordinationStepId): Promise<CoordinationStepStatus>;
  escalate(organizationId: OrganizationId, missionId: MissionId, reason: string): Promise<EscalationRequestId>;
  completeMission(organizationId: OrganizationId, missionId: MissionId): Promise<MissionExecutionId>;
}

export type { CoordinatorId, CoordinationPlanId, CoordinationPolicyId, CoordinationStepId, OrganizationId, WorkerId };
