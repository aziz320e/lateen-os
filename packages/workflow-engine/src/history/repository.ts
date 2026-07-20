/** @module history/repository */
import type { Repository } from '../shared/repository.js';
import type {
  AuditTrail,
  AuditTrailId,
  ExecutionHistory,
  ExecutionHistoryId,
  WorkflowHistory,
  WorkflowHistoryId,
} from './types.js';

export type WorkflowHistoryRepository = Repository<WorkflowHistory, WorkflowHistoryId>;
export type ExecutionHistoryRepository = Repository<ExecutionHistory, ExecutionHistoryId>;
export type AuditTrailRepository = Repository<AuditTrail, AuditTrailId>;
