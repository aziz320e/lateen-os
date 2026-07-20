/** @module worker/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type {
  AgentId,
  DepartmentId,
  EmployeeId,
  OrganizationId,
  RuntimeAgentId,
  SkillId,
  WorkerId,
  WorkerRoleId,
  WorkerSkillId,
} from '../shared/identifiers.js';
import type { ScoreValue, Timestamp, WorkforceType } from '../shared/primitives.js';

export type CapabilityReferenceId = Identifier;

export type { WorkerId };

export type WorkerStatus =
  | 'draft'
  | 'onboarding'
  | 'active'
  | 'busy'
  | 'away'
  | 'paused'
  | 'suspended'
  | 'offboarded'
  | 'archived';

export type WorkerLifecycle =
  | 'registered'
  | 'provisioned'
  | 'activated'
  | 'assigned'
  | 'executing'
  | 'reviewing'
  | 'paused'
  | 'suspended'
  | 'offboarded';

export type AvailabilityState = 'available' | 'limited' | 'unavailable' | 'scheduled';

/** Organizational role held by a digital employee. */
export interface WorkerRole {
  readonly roleId: WorkerRoleId;
  readonly code: string;
  readonly name: string;
  readonly departmentId?: DepartmentId;
}

/** Platform capability assigned to a worker. */
export interface WorkerCapability {
  readonly capabilityId: CapabilityReferenceId;
  readonly label: string;
  readonly proficiency: ScoreValue;
}

/** Skill proficiency for a worker. */
export interface WorkerSkill {
  readonly workerSkillId: WorkerSkillId;
  readonly skillId: SkillId;
  readonly name: string;
  readonly level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  readonly score: ScoreValue;
}

/** Current availability snapshot for scheduling and delegation. */
export interface WorkerAvailability {
  readonly state: AvailabilityState;
  readonly effectiveFrom: Timestamp;
  readonly effectiveUntil?: Timestamp;
  readonly maxConcurrentTasks: number;
  readonly activeTaskCount: number;
  readonly notes?: string;
}

/** Workforce profile — organizational identity above runtime execution profile. */
export interface WorkerProfile {
  readonly displayName: string;
  readonly title: string;
  readonly description?: string;
  readonly workforceType: WorkforceType;
  readonly departmentId?: DepartmentId;
  readonly supervisorEmployeeId?: EmployeeId;
  readonly proactiveEnabled: boolean;
  readonly reactiveEnabled: boolean;
}

/**
 * AI Worker aggregate — digital employee managed by AI Workforce.
 * Links Business DNA identity to AI Runtime execution.
 */
export interface AIWorker extends TenantAuditableEntity<WorkerId> {
  readonly businessDnaAgentId: AgentId;
  readonly runtimeAgentId: RuntimeAgentId;
  readonly profile: WorkerProfile;
  readonly roles: readonly WorkerRole[];
  readonly capabilities: readonly WorkerCapability[];
  readonly skills: readonly WorkerSkill[];
  readonly availability: WorkerAvailability;
  readonly status: WorkerStatus;
  readonly lifecycle: WorkerLifecycle;
}

export type { OrganizationId, AgentId, RuntimeAgentId };
