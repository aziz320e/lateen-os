/** @module goals/repository */
import type { Repository } from '../shared/repository.js';
import type { Goal, GoalId, KeyResult, KeyResultId, Objective, ObjectiveId } from './types.js';

export type GoalRepository = Repository<Goal, GoalId>;
export type ObjectiveRepository = Repository<Objective, ObjectiveId>;
export type KeyResultRepository = Repository<KeyResult, KeyResultId>;
