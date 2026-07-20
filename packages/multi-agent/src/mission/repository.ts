/** @module mission/repository */
import type { Repository } from '../shared/repository.js';
import type { Mission, MissionId, MissionObjective, MissionObjectiveId } from './types.js';

export type MissionRepository = Repository<Mission, MissionId>;
export type MissionObjectiveRepository = Repository<MissionObjective, MissionObjectiveId>;
