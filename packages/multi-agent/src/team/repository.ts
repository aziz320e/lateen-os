/** @module team/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionMember, MissionMemberId, MissionTeam, MissionTeamId } from './types.js';

export type MissionTeamRepository = Repository<MissionTeam, MissionTeamId>;
export type MissionMemberRepository = Repository<MissionMember, MissionMemberId>;
