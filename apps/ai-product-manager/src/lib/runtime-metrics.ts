import type { AiRuntimeTask } from '@/types';

export function runtimeMetrics(tasks: AiRuntimeTask[]) {
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const failed = tasks.filter((t) => t.status === 'failed').length;
  const running = tasks.filter((t) => t.status === 'running').length;
  const successRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return { completed, failed, running, successRate, total: tasks.length };
}
