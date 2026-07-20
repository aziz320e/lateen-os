/** @module execution/repository */
import type { Repository } from '../shared/repository.js';
import type {
  ExecutionStage,
  ExecutionStageId,
  MissionExecution,
  MissionExecutionId,
} from './types.js';

export type MissionExecutionRepository = Repository<MissionExecution, MissionExecutionId>;
export type ExecutionStageRepository = Repository<ExecutionStage, ExecutionStageId>;
