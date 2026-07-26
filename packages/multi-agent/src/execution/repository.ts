/** @module execution/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type {
  ExecutionStage,
  ExecutionStageId,
  MissionExecution,
  MissionExecutionId,
} from './types.js';

export interface MissionExecutionRepository extends Repository<MissionExecution, MissionExecutionId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<readonly MissionExecution[]>;
}
export interface ExecutionStageRepository extends Repository<ExecutionStage, ExecutionStageId> {
  findByExecution(organizationId: OrganizationId, executionId: MissionExecutionId): Promise<readonly ExecutionStage[]>;
}
