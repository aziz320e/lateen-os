/** @module execution/types */
import type { WorkflowInstanceId } from '@lateen-os/workflow-engine';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  ExecutionStageId,
  MissionExecutionId,
  MissionId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { ScoreValue, Timestamp } from '../shared/primitives.js';

export type ExecutionStageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export type MissionExecutionStatus = 'planned' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/** Stage within mission execution lifecycle. */
export interface ExecutionStage extends TenantAuditableEntity<ExecutionStageId> {
  readonly executionId: MissionExecutionId;
  readonly name: string;
  readonly sequence: number;
  readonly status: ExecutionStageStatus;
  readonly workflowInstanceId?: WorkflowInstanceId;
  readonly startedAt?: Timestamp;
  readonly completedAt?: Timestamp;
}

/** Outcome of a completed mission execution. */
export interface ExecutionResult {
  readonly executionId: MissionExecutionId;
  readonly success: boolean;
  readonly outcomeScore?: ScoreValue;
  readonly summary: string;
  readonly completedAt: Timestamp;
  readonly artifactReferences: readonly string[];
}

/** Runtime execution record for a multi-agent mission. */
export interface MissionExecution extends TenantAuditableEntity<MissionExecutionId> {
  readonly missionId: MissionId;
  readonly status: MissionExecutionStatus;
  readonly stageIds: readonly ExecutionStageId[];
  readonly result?: ExecutionResult;
  readonly startedAt?: Timestamp;
  readonly completedAt?: Timestamp;
}

export type { MissionExecutionId, ExecutionStageId, OrganizationId };
