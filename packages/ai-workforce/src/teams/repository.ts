/** @module teams/repository */
import type { Repository } from '../shared/repository.js';
import type { AITeam, TeamId, TeamMember, TeamMemberId } from './types.js';

export type TeamRepository = Repository<AITeam, TeamId>;
export type TeamMemberRepository = Repository<TeamMember, TeamMemberId>;
