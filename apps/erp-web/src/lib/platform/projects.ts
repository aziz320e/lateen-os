/** Projects adapter — calls `apps/backend`'s real `/api/v1/projects/*` REST API exclusively through `src/lib/api/client.ts`. */
import { apiGet, apiGetPaged } from '../api/client';
import type { Project } from './types';

export async function listProjects(
  params: { limit?: number; offset?: number } = {},
): Promise<{ projects: readonly Project[]; total: number }> {
  const page = await apiGetPaged<Project>('/api/v1/projects', params);
  return { projects: page.data, total: page.meta.total };
}

export async function getProject(id: string): Promise<Project | null> {
  return apiGet<Project | null>(`/api/v1/projects/${id}`);
}

export async function getProjectsSummary(): Promise<{ projectCount: number; taskCount: number }> {
  const [projects, tasks] = await Promise.all([
    apiGetPaged<Project>('/api/v1/projects', { limit: 1 }),
    apiGetPaged<unknown>('/api/v1/projects/tasks', { limit: 1 }),
  ]);
  return { projectCount: projects.meta.total, taskCount: tasks.meta.total };
}
