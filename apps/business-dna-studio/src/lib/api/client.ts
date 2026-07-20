'use client';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const orgBase = '/api/business-dna/organizations/current';

export function listEntities(resourcePath: string) {
  return apiFetch<Record<string, unknown>[]>(`${orgBase}/${resourcePath}`);
}

export function getEntity(resourcePath: string, id: string) {
  return apiFetch<Record<string, unknown>>(`${orgBase}/${resourcePath}/${id}`);
}

export function createEntity(resourcePath: string, body: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>(`${orgBase}/${resourcePath}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateEntity(resourcePath: string, id: string, body: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>(`${orgBase}/${resourcePath}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function deleteEntity(resourcePath: string, id: string) {
  return apiFetch<void>(`${orgBase}/${resourcePath}/${id}`, { method: 'DELETE' });
}

export function getOrganization() {
  return apiFetch<Record<string, unknown>>(`/api/business-dna/organizations/current`);
}

export function updateOrganization(body: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>(`/api/business-dna/organizations/current`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function fetchStudioDashboard() {
  return apiFetch<StudioDashboard>('/api/studio/dashboard');
}

export function validateEntity(resource: string, payload: Record<string, unknown>) {
  return apiFetch<ValidationResult>('/api/studio/validate', {
    method: 'POST',
    body: JSON.stringify({ resource, payload }),
  });
}

export function analyzeImpact(resource: string, entityId: string) {
  return apiFetch<ImpactResult>(`/api/studio/impact?resource=${resource}&entityId=${entityId}`);
}

export interface StudioDashboard {
  organization: Record<string, unknown> | null;
  counts: Record<string, number>;
  branches: Record<string, unknown>[];
  departments: Record<string, unknown>[];
  products: Record<string, unknown>[];
  machines: Record<string, unknown>[];
  agents: Record<string, unknown>[];
  projects: Record<string, unknown>[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImpactResult {
  resource: string;
  entityId: string;
  dependents: { type: string; count: number; label: string }[];
  risk: 'low' | 'medium' | 'high';
}
