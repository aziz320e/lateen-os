/** @module task/repository */
import type { OrganizationId, RuntimeAgentId, TaskId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Task, TaskStatus } from './types.js';

export interface TaskRepository extends Repository<Task, TaskId> {
  findByAgent(
    organizationId: OrganizationId,
    runtimeAgentId: RuntimeAgentId,
  ): Promise<readonly Task[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: TaskStatus,
  ): Promise<readonly Task[]>;
}
