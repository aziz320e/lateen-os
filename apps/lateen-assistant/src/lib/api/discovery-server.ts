import { getAuthHeaders, getOrganizationId } from '@/lib/auth';
import { serverEnv } from '@/lib/env';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_PRODUCT_DISCOVERY_BASE_URL;

async function discoveryFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Discovery API ${response.status}: ${path}`);
  return response.json() as Promise<T>;
}

export async function runDiscovery(keywords: string[]) {
  return discoveryFetch<Record<string, unknown>>('/api/v1/discovery/run', {
    method: 'POST',
    body: JSON.stringify({ organizationId: getOrganizationId(), keywords }),
  });
}

export async function listDiscoveryRuns() {
  const orgId = getOrganizationId();
  return discoveryFetch<Record<string, unknown>[]>(`/api/v1/discovery/runs?organizationId=${orgId}`).catch(() => []);
}

export async function listRecommendations(limit = 20) {
  const orgId = getOrganizationId();
  return discoveryFetch<Record<string, unknown>[]>(
    `/api/v1/discovery/recommendations?organizationId=${orgId}&limit=${limit}`,
  ).catch(() => []);
}

export async function getPlatformHealth() {
  return discoveryFetch<Record<string, unknown>>('/platform/health').catch(() => ({ status: 'unknown' }));
}
