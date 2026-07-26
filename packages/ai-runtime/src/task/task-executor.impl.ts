/**
 * Real task executor — runs a caller-supplied handler for a task with
 * retry, persists status transitions (running -> completed/failed), and
 * never throws (execution failures become a "failed" task with a result,
 * matching the Task/TaskResult contract).
 *
 * @module task/task-executor.impl
 */
import { withRetry, type RetryOptions } from '@lateen-os/shared-kernel/observability';
import type { OrganizationId } from '../shared/identifiers.js';
import type { Task, TaskResult } from './types.js';
import type { TaskRepository } from './repository.js';

export interface TaskHandlerContext {
  readonly organizationId: OrganizationId;
}

export type TaskHandler = (task: Task, context: TaskHandlerContext) => Promise<TaskResult>;

export interface ExecuteTaskOptions {
  readonly retry?: RetryOptions;
}

export interface TaskExecutor {
  /** Runs `handler` for `task`, persisting real status transitions through the repository. Always returns (never throws). */
  execute(task: Task, handler: TaskHandler, options?: ExecuteTaskOptions): Promise<Task>;
}

/** Creates a {@link TaskExecutor} backed by a {@link TaskRepository}. */
export function createTaskExecutor(taskRepository: TaskRepository): TaskExecutor {
  return {
    async execute(task, handler, options) {
      const running: Task = { ...task, status: 'running', updatedAt: new Date().toISOString() };
      await taskRepository.save(running);

      try {
        const result = await withRetry(() => handler(running, { organizationId: task.organizationId }), options?.retry);
        const completed: Task = {
          ...running,
          status: result.success ? 'completed' : 'failed',
          result,
          updatedAt: new Date().toISOString(),
        };
        await taskRepository.save(completed);
        return completed;
      } catch (error) {
        const failed: Task = {
          ...running,
          status: 'failed',
          result: {
            success: false,
            errorCode: 'EXECUTION_ERROR',
            output: error instanceof Error ? error.message : String(error),
            completedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        };
        await taskRepository.save(failed);
        return failed;
      }
    },
  };
}
