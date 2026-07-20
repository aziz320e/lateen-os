/** @module routing/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  MissionId,
  MissionRouteId,
  OrganizationId,
  ServiceRouteId,
  WorkerId,
  WorkerRouteId,
  WorkflowDefinitionId,
  WorkflowRouteId,
} from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type {
  ServiceRouteId,
  WorkflowRouteId,
  MissionRouteId,
  WorkerRouteId,
  OrganizationId,
};

/** Route to a platform backend service. */
export interface ServiceRoute extends TenantAuditableEntity<ServiceRouteId> {
  readonly serviceName: string;
  readonly endpoint: string;
  readonly operation: string;
  readonly priority: number;
  readonly rationale?: string;
}

/** Route to start or continue a workflow. */
export interface WorkflowRoute extends TenantAuditableEntity<WorkflowRouteId> {
  readonly workflowDefinitionId: WorkflowDefinitionId;
  readonly trigger: string;
  readonly confidence: ScoreValue;
  readonly rationale?: string;
}

/** Route to start or assign a mission. */
export interface MissionRoute extends TenantAuditableEntity<MissionRouteId> {
  readonly missionId?: MissionId;
  readonly missionType: string;
  readonly confidence: ScoreValue;
  readonly rationale?: string;
}

/** Route assigning an AI worker to a planned action. */
export interface WorkerRoute extends TenantAuditableEntity<WorkerRouteId> {
  readonly workerId: WorkerId;
  readonly role: string;
  readonly confidence: ScoreValue;
  readonly rationale?: string;
}

/** Aggregate routing decision across platform targets. */
export interface RoutingDecision {
  readonly organizationId: OrganizationId;
  readonly serviceRoutes: readonly ServiceRoute[];
  readonly workflowRoutes: readonly WorkflowRoute[];
  readonly missionRoutes: readonly MissionRoute[];
  readonly workerRoutes: readonly WorkerRoute[];
}
