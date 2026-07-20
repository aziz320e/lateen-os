/** @module instance/repository */
import type { Repository } from '../shared/repository.js';
import type {
  WorkflowExecution,
  WorkflowExecutionId,
  WorkflowInstance,
  WorkflowInstanceId,
} from './types.js';

export type WorkflowInstanceRepository = Repository<WorkflowInstance, WorkflowInstanceId>;
export type WorkflowExecutionRepository = Repository<WorkflowExecution, WorkflowExecutionId>;
