/**
 * Real Mission Execution service — records a mission's execution and
 * per-stage outcomes.
 *
 * @module execution/service.impl
 */
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { ExecutionStageRepository, MissionExecutionRepository } from './repository.js';
import type { ExecutionStage, ExecutionStageStatus, MissionExecution } from './types.js';

export interface StageInput {
  readonly name: string;
  readonly status: ExecutionStageStatus;
}

export interface ExecutionService {
  /** Records a mission execution with one stage per input, and its final result — a single, real, auditable record. */
  finalize(
    organizationId: OrganizationId,
    missionId: MissionId,
    stages: readonly StageInput[],
    success: boolean,
    summary: string,
    outcomeScore?: string,
  ): Promise<MissionExecution>;
}

/** Creates a real {@link ExecutionService}. */
export function createExecutionService(
  executionRepository: MissionExecutionRepository,
  stageRepository: ExecutionStageRepository,
): ExecutionService {
  return {
    async finalize(organizationId, missionId, stages, success, summary, outcomeScore) {
      const now = nowIso();
      const executionId = generateId('mission-execution');

      const stageRecords: ExecutionStage[] = stages.map((stage, index) => ({
        id: generateId('execution-stage'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        executionId,
        name: stage.name,
        sequence: index + 1,
        status: stage.status,
        startedAt: now,
        completedAt: now,
      }));
      for (const stage of stageRecords) await stageRepository.save(stage);

      const execution: MissionExecution = {
        id: executionId,
        organizationId,
        createdAt: now,
        updatedAt: now,
        missionId,
        status: success ? 'completed' : 'failed',
        stageIds: stageRecords.map((stage) => stage.id),
        result: {
          executionId,
          success,
          outcomeScore,
          summary,
          completedAt: now,
          artifactReferences: [],
        },
        startedAt: now,
        completedAt: now,
      };
      await executionRepository.save(execution);
      return execution;
    },
  };
}
