/** HR adapter — calls `apps/backend`'s real `/api/v1/hr/*` REST API exclusively through `src/lib/api/client.ts`. */
import { apiGet, apiGetPaged } from '../api/client';
import type { Employee } from './types';

export async function listEmployees(
  params: { limit?: number; offset?: number } = {},
): Promise<{ employees: readonly Employee[]; total: number }> {
  const page = await apiGetPaged<Employee>('/api/v1/hr/employees', params);
  return { employees: page.data, total: page.meta.total };
}

export async function getEmployee(id: string): Promise<Employee | null> {
  return apiGet<Employee | null>(`/api/v1/hr/employees/${id}`);
}

export async function getHrSummary(): Promise<{ employeeCount: number; departmentCount: number }> {
  const [employees, departments] = await Promise.all([
    apiGetPaged<Employee>('/api/v1/hr/employees', { limit: 1 }),
    apiGetPaged<unknown>('/api/v1/hr/departments', { limit: 1 }),
  ]);
  return { employeeCount: employees.meta.total, departmentCount: departments.meta.total };
}
