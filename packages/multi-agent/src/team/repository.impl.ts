/** Real in-memory {@link MissionTeamRepository} / {@link MissionMemberRepository} implementations. @module team/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { MissionMember, MissionTeam } from './types.js';
import type { MissionMemberRepository, MissionTeamRepository } from './repository.js';

export function createMissionTeamRepository(seed?: readonly MissionTeam[]): MissionTeamRepository {
  const repo = createInMemoryRepository<MissionTeam>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).find((team) => team.missionId === missionId) ?? null;
    },
  };
}

export function createMissionMemberRepository(seed?: readonly MissionMember[]): MissionMemberRepository {
  const repo = createInMemoryRepository<MissionMember>({ seed });
  return {
    ...repo,
    async findByTeam(organizationId, teamId) {
      return repo.list(organizationId).filter((member) => member.teamId === teamId);
    },
  };
}
