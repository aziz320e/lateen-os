/** @module instance/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type {
  WorkflowExecution,
  WorkflowExecutionId,
  WorkflowInstance,
  WorkflowInstanceId,
  WorkflowStatus,
} from './types.js';

export interface WorkflowInstanceRepository extends Repository<WorkflowInstance, WorkflowInstanceId> {
  findByStatus(organizationId: OrganizationId, status: WorkflowStatus): Promise<readonly WorkflowInstance[]>;
  findAll(organizationId: OrganizationId): Promise<readonly WorkflowInstance[]>;
}
export type WorkflowExecutionRepository = Repository<WorkflowExecution, WorkflowExecutionId>;
