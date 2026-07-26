/** @module team/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { MissionMember, MissionMemberId, MissionTeam, MissionTeamId } from './types.js';

export interface MissionTeamRepository extends Repository<MissionTeam, MissionTeamId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<MissionTeam | null>;
}
export interface MissionMemberRepository extends Repository<MissionMember, MissionMemberId> {
  findByTeam(organizationId: OrganizationId, teamId: MissionTeamId): Promise<readonly MissionMember[]>;
}
