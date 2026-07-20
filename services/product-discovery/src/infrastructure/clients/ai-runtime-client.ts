import { randomUUID } from 'node:crypto';
import type { Task, TaskId } from '@lateen-os/ai-runtime';
import type { AiRuntimePort, ScheduleDiscoveryTaskRequest } from '../../ports/outbound/ai-runtime-port.js';
import type { OrganizationId } from '../../domain/identifiers.js';

export function createNoOpAiRuntimeClient(): AiRuntimePort {
  const tasks = new Map<string, Task>();

  return {
    async scheduleDiscoveryTask(request: ScheduleDiscoveryTaskRequest): Promise<TaskId> {
      const now = new Date().toISOString();
      const taskId = randomUUID() as TaskId;
      tasks.set(taskId as string, {
        id: taskId,
        organizationId: request.organizationId,
        title: request.title,
        runtimeAgentId: request.runtimeAgentId,
        priority: request.priority ?? 'normal',
        status: 'completed',
        createdAt: now,
        updatedAt: now,
      });
      return taskId;
    },
    async getTask(_organizationId: OrganizationId, taskId: TaskId): Promise<Task | null> {
      return tasks.get(taskId as string) ?? null;
    },
    async findAgent() {
      return { agents: [] };
    },
    async findTasks() {
      return { tasks: [...tasks.values()] };
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
