/**
 * Real Agent Teams service — assembles and manages a mission's team.
 *
 * @module team/service.impl
 */
import type { WorkerId } from '@lateen-os/ai-workforce';
import { NotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { MissionWorkerRole } from '../shared/primitives.js';
import type { MissionMemberRepository, MissionTeamRepository } from './repository.js';
import type { MissionMember, MissionRole, MissionTeam, MissionTeamId } from './types.js';

export interface AssembleTeamInput {
  readonly organizationId: OrganizationId;
  readonly missionId: MissionId;
  readonly name: string;
  readonly leaderWorkerId: WorkerId;
  readonly leaderRole: MissionWorkerRole;
  readonly requiredRoles: readonly MissionWorkerRole[];
}

export interface TeamService {
  assemble(input: AssembleTeamInput): Promise<MissionTeam>;
  addMember(organizationId: OrganizationId, teamId: MissionTeamId, workerId: WorkerId, role: MissionRole): Promise<MissionMember>;
  removeMember(organizationId: OrganizationId, teamId: MissionTeamId, workerId: WorkerId): Promise<MissionTeam>;
  listMembers(organizationId: OrganizationId, teamId: MissionTeamId): Promise<readonly MissionMember[]>;
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<MissionTeam | null>;
}

/** Creates a real {@link TeamService}. */
export function createTeamService(teamRepository: MissionTeamRepository, memberRepository: MissionMemberRepository): TeamService {
  async function requireTeam(organizationId: OrganizationId, teamId: MissionTeamId): Promise<MissionTeam> {
    const team = await teamRepository.findById(organizationId, teamId);
    if (!team) throw new NotFoundError('MissionTeam', teamId);
    return team;
  }

  return {
    async assemble(input) {
      const now = nowIso();
      const team: MissionTeam = {
        id: generateId('mission-team'),
        organizationId: input.organizationId,
        createdAt: now,
        updatedAt: now,
        missionId: input.missionId,
        name: input.name,
        leader: { workerId: input.leaderWorkerId, role: input.leaderRole, appointedAt: now },
        memberIds: [],
        requiredRoles: input.requiredRoles,
      };
      await teamRepository.save(team);
      return team;
    },

    async addMember(organizationId, teamId, workerId, role) {
      const team = await requireTeam(organizationId, teamId);
      const now = nowIso();
      const member: MissionMember = {
        id: generateId('mission-member'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        teamId,
        workerId,
        role,
        status: 'active',
      };
      await memberRepository.save(member);
      await teamRepository.save({ ...team, memberIds: [...team.memberIds, member.id], updatedAt: now });
      return member;
    },

    async removeMember(organizationId, teamId, workerId) {
      const team = await requireTeam(organizationId, teamId);
      const members = await memberRepository.findByTeam(organizationId, teamId);
      const target = members.find((member) => member.workerId === workerId);
      if (!target) throw new NotFoundError('MissionMember', workerId);

      const now = nowIso();
      await memberRepository.save({ ...target, status: 'removed', updatedAt: now });
      const updated: MissionTeam = { ...team, memberIds: team.memberIds.filter((id) => id !== target.id), updatedAt: now };
      await teamRepository.save(updated);
      return updated;
    },

    async listMembers(organizationId, teamId) {
      return memberRepository.findByTeam(organizationId, teamId);
    },

    async findByMission(organizationId, missionId) {
      return teamRepository.findByMission(organizationId, missionId);
    },
  };
}
