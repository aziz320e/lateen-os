/** @module teams/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  DepartmentId,
  OrganizationId,
  TeamId,
  TeamMemberId,
  WorkerId,
} from '../shared/identifiers.js';

export type { TeamId, TeamMemberId };

export type TeamStatus = 'forming' | 'active' | 'paused' | 'disbanded' | 'archived';

export type TeamMemberRole = 'member' | 'lead' | 'coordinator' | 'observer';

/** Team lead assignment — may be a worker or human employee reference. */
export interface TeamLead {
  readonly workerId?: WorkerId;
  readonly employeeId?: string;
  readonly assignedAt: string;
}

/** Member of an AI team. */
export interface TeamMember extends TenantAuditableEntity<TeamMemberId> {
  readonly teamId: TeamId;
  readonly workerId: WorkerId;
  readonly role: TeamMemberRole;
  readonly joinedAt: string;
  readonly leftAt?: string;
}

/** AI team — collaborative unit of digital employees. */
export interface AITeam extends TenantAuditableEntity<TeamId> {
  readonly name: string;
  readonly description?: string;
  readonly departmentId?: DepartmentId;
  readonly status: TeamStatus;
  readonly lead: TeamLead;
  readonly memberIds: readonly TeamMemberId[];
  readonly objectiveSummary?: string;
}

export type { OrganizationId, WorkerId };
