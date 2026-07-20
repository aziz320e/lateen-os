/** @module planner/types */
import type { ExecutionGraph } from '../execution-plan/types.js';
import type { IntentId } from '../intent/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  BrainExecutionPlanId,
  MissionId,
  MissionPlanId,
  OrganizationId,
  WorkerId,
  WorkerPlanId,
  WorkflowDefinitionId,
  WorkflowInstanceId,
  WorkflowPlanId,
} from '../shared/identifiers.js';

export type {
  BrainExecutionPlanId,
  MissionPlanId,
  WorkflowPlanId,
  WorkerPlanId,
  OrganizationId,
};

export type BrainPlanStatus =
  | 'draft'
  | 'pending_validation'
  | 'validated'
  | 'rejected'
  | 'ready'
  | 'executing'
  | 'completed'
  | 'failed';

/** Plan to start or continue a multi-agent mission. */
export interface MissionPlan extends TenantAuditableEntity<MissionPlanId> {
  readonly planId: BrainExecutionPlanId;
  readonly missionId?: MissionId;
  readonly missionType: string;
  readonly objective: string;
  readonly priority: 'critical' | 'high' | 'medium' | 'low';
  readonly rationale?: string;
}

/** Plan to start or advance a workflow instance. */
export interface WorkflowPlan extends TenantAuditableEntity<WorkflowPlanId> {
  readonly planId: BrainExecutionPlanId;
  readonly workflowDefinitionId: WorkflowDefinitionId;
  readonly workflowInstanceId?: WorkflowInstanceId;
  readonly trigger: string;
  readonly inputPayload?: Readonly<Record<string, unknown>>;
  readonly rationale?: string;
}

/** Plan assigning AI workers to planned actions. */
export interface WorkerPlan extends TenantAuditableEntity<WorkerPlanId> {
  readonly planId: BrainExecutionPlanId;
  readonly workerId: WorkerId;
  readonly role: string;
  readonly taskSummary: string;
  readonly skillsRequired: readonly string[];
  readonly rationale?: string;
}

/**
 * Platform-level execution plan produced by AI Brain.
 *
 * Distinct from `@lateen-os/ai-runtime` task execution plans — this orchestrates
 * missions, workflows, services, and workers across the platform.
 */
export interface ExecutionPlan extends TenantAuditableEntity<BrainExecutionPlanId> {
  readonly intentId: IntentId;
  readonly status: BrainPlanStatus;
  readonly summary: string;
  readonly missionPlan?: MissionPlan;
  readonly workflowPlans: readonly WorkflowPlan[];
  readonly workerPlans: readonly WorkerPlan[];
  readonly graph: ExecutionGraph;
  readonly rejectionReason?: string;
}
