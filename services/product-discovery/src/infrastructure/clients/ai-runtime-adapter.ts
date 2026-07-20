import { randomUUID } from 'node:crypto';
import type { Task, TaskId } from '@lateen-os/ai-runtime';
import type { AiRuntimePort, ScheduleDiscoveryTaskRequest } from '../../ports/outbound/ai-runtime-port.js';
import type { OrganizationId, DiscoveryRunId } from '../../domain/identifiers.js';
import type { CacheStore } from '../cache/redis-cache.js';

/**
 * Platform AI Runtime adapter using @lateen-os/ai-runtime types.
 * DiscoveryRun is registered as an executable runtime task.
 */
export function createAiRuntimeAdapter(cache: CacheStore): AiRuntimePort {
  const taskKey = (taskId: TaskId) => `ai-runtime:task:${taskId as string}`;
  const runTaskKey = (runId: DiscoveryRunId) => `ai-runtime:run:${runId as string}`;

  return {
    async scheduleDiscoveryTask(request: ScheduleDiscoveryTaskRequest): Promise<TaskId> {
      const now = new Date().toISOString();
      const taskId = randomUUID() as TaskId;
      const task: Task = {
        id: taskId,
        organizationId: request.organizationId,
        title: request.title,
        description: `Product discovery run ${request.runId as string}`,
        runtimeAgentId: request.runtimeAgentId,
        priority: request.priority ?? 'normal',
        status: 'running',
        createdAt: now,
        updatedAt: now,
      };
      await cache.set(taskKey(taskId), task);
      await cache.set(runTaskKey(request.runId), taskId);
      return taskId;
    },

    async getTask(_organizationId: OrganizationId, taskId: TaskId): Promise<Task | null> {
      return cache.get<Task>(taskKey(taskId));
    },

    async findAgent() {
      return { agents: [] };
    },
    async findTasks() {
      return { tasks: [] };
    },
    async findSessions() {
      return { sessions: [] };
    },
    async findConversations() {
      return { conversations: [] };
    },
    async findRuntimeState() {
      return { state: 'ready', activeSessionCount: 0, queuedTaskCount: 0 };
    },
    async findExecutionHistory() {
      return { results: [] };
    },
  } as unknown as AiRuntimePort;
}

export async function completeDiscoveryTask(
  cache: CacheStore,
  runId: DiscoveryRunId,
  success: boolean,
): Promise<void> {
  const taskId = await cache.get<TaskId>(`ai-runtime:run:${runId as string}`);
  if (!taskId) return;
  const task = await cache.get<Task>(`ai-runtime:task:${taskId as string}`);
  if (!task) return;
  const updated: Task = {
    ...task,
    status: success ? 'completed' : 'failed',
    updatedAt: new Date().toISOString(),
    result: {
      success,
      completedAt: new Date().toISOString(),
    },
  };
  await cache.set(`ai-runtime:task:${taskId as string}`, updated);
}
