import { getAuthHeaders } from '@/lib/auth';
import { serverEnv } from '@/lib/env';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_INTEGRATION_HUB_BASE_URL;

async function hubFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Integration Hub ${response.status}: ${path}`);
  return response.json() as Promise<T>;
}

export async function listConnectorDefinitions() {
  return hubFetch<Record<string, unknown>[]>('/api/connectors/definitions').catch(() => []);
}

export async function listConnectors() {
  return hubFetch<Record<string, unknown>[]>('/api/connectors').catch(() => []);
}

export async function getMonitoringSnapshot() {
  return hubFetch<Record<string, unknown>>('/api/connectors/monitoring/snapshot').catch(() => ({}));
}

export async function listSyncJobs() {
  return hubFetch<Record<string, unknown>[]>('/api/sync').catch(() => []);
}
