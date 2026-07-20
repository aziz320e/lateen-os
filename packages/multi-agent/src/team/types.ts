/** @module team/types */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  MissionId,
  MissionMemberId,
  MissionTeamId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { MissionWorkerRole } from '../shared/primitives.js';

export type MissionMemberStatus = 'invited' | 'active' | 'delegated' | 'offline' | 'removed';

/** Role assignment within a mission team. */
export interface MissionRole {
  readonly role: MissionWorkerRole;
  readonly responsibilities: readonly string[];
  readonly decisionAuthority: 'recommend' | 'propose' | 'approve' | 'none';
}

/** Leader of a mission team — typically CEO AI or designated coordinator worker. */
export interface MissionLeader {
  readonly workerId: WorkerId;
  readonly role: MissionWorkerRole;
  readonly appointedAt: string;
}

/** Member participating in a mission team. */
export interface MissionMember extends TenantAuditableEntity<MissionMemberId> {
  readonly teamId: MissionTeamId;
  readonly workerId: WorkerId;
  readonly role: MissionRole;
  readonly status: MissionMemberStatus;
}

/** Team assembled for a specific mission. */
export interface MissionTeam extends TenantAuditableEntity<MissionTeamId> {
  readonly missionId: MissionId;
  readonly name: string;
  readonly leader: MissionLeader;
  readonly memberIds: readonly MissionMemberId[];
  readonly requiredRoles: readonly MissionWorkerRole[];
}

export type { MissionTeamId, MissionMemberId, OrganizationId, WorkerId };
