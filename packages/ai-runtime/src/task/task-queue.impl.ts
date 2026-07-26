/**
 * Real task queue management — priority-ordered dequeue over a
 * {@link TaskRepository}.
 *
 * @module task/task-queue.impl
 */
import type { OrganizationId, RuntimeAgentId } from '../shared/identifiers.js';
import type { Task, TaskPriority, TaskQueue } from './types.js';
import type { TaskRepository } from './repository.js';

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
  background: 4,
};

function bySeverity(a: Task, b: Task): number {
  const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (priorityDiff !== 0) return priorityDiff;
  return (a.scheduledAt ?? a.createdAt).localeCompare(b.scheduledAt ?? b.createdAt);
}

export interface TaskQueueService {
  enqueue(task: Task): Promise<void>;
  /** Claims the highest-priority queued task (oldest first within a priority tier), marking it "assigned". */
  dequeue(organizationId: OrganizationId, runtimeAgentId?: RuntimeAgentId): Promise<Task | null>;
  getQueue(organizationId: OrganizationId, runtimeAgentId?: RuntimeAgentId): Promise<TaskQueue>;
}

/** Creates a {@link TaskQueueService} backed by a {@link TaskRepository}. */
export function createTaskQueueService(taskRepository: TaskRepository): TaskQueueService {
  async function findQueued(organizationId: OrganizationId, runtimeAgentId?: RuntimeAgentId): Promise<Task[]> {
    const tasks = runtimeAgentId
      ? await taskRepository.findByAgent(organizationId, runtimeAgentId)
      : await taskRepository.findByStatus(organizationId, 'queued');
    return tasks.filter((task) => task.status === 'queued');
  }

  return {
    async enqueue(task) {
      await taskRepository.save(task);
    },

    async dequeue(organizationId, runtimeAgentId) {
      const queued = await findQueued(organizationId, runtimeAgentId);
      if (queued.length === 0) return null;

      const next = [...queued].sort(bySeverity)[0]!;
      const assigned: Task = { ...next, status: 'assigned', updatedAt: new Date().toISOString() };
      await taskRepository.save(assigned);
      return assigned;
    },

    async getQueue(organizationId, runtimeAgentId) {
      const queued = await findQueued(organizationId, runtimeAgentId);
      return {
        organizationId,
        runtimeAgentId,
        taskIds: [...queued].sort(bySeverity).map((task) => task.id),
      };
    },
  };
}
