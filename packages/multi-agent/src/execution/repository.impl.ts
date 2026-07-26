/** Real in-memory mission execution repository implementations. @module execution/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ExecutionStage, MissionExecution } from './types.js';
import type { ExecutionStageRepository, MissionExecutionRepository } from './repository.js';

export function createMissionExecutionRepository(seed?: readonly MissionExecution[]): MissionExecutionRepository {
  const repo = createInMemoryRepository<MissionExecution>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).filter((execution) => execution.missionId === missionId);
    },
  };
}

export function createExecutionStageRepository(seed?: readonly ExecutionStage[]): ExecutionStageRepository {
  const repo = createInMemoryRepository<ExecutionStage>({ seed });
  return {
    ...repo,
    async findByExecution(organizationId, executionId) {
      return repo.list(organizationId).filter((stage) => stage.executionId === executionId);
    },
  };
}
