import { getAuthHeaders, getOrganizationId } from '@/lib/auth';
import { serverEnv } from '@/lib/env';
import type { DiscoveryRecommendation, PlatformHealth, ProductDiscoveryRun } from '@/types';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_PRODUCT_DISCOVERY_BASE_URL;

async function discoveryFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: { ...getAuthHeaders(), ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discovery API ${response.status}: ${text}`);
  }
  return response.json() as Promise<T>;
}

export async function runDiscovery(keywords: string[], runtimeAgentId?: string) {
  return discoveryFetch<ProductDiscoveryRun>('/api/v1/discovery/run', {
    method: 'POST',
    body: JSON.stringify({
      organizationId: getOrganizationId(),
      keywords,
      runtimeAgentId,
    }),
  });
}

export async function listDiscoveryRuns() {
  const orgId = getOrganizationId();
  return discoveryFetch<ProductDiscoveryRun[]>(`/api/v1/discovery/runs?organizationId=${orgId}`);
}

export async function getDiscoveryRun(runId: string) {
  const orgId = getOrganizationId();
  return discoveryFetch<ProductDiscoveryRun>(
    `/api/v1/discovery/runs/${runId}?organizationId=${orgId}`,
  );
}

export async function listRecommendations(runId?: string, limit = 50) {
  const orgId = getOrganizationId();
  const params = new URLSearchParams({ organizationId: orgId, limit: String(limit) });
  if (runId) params.set('runId', runId);
  return discoveryFetch<DiscoveryRecommendation[]>(
    `/api/v1/discovery/recommendations?${params.toString()}`,
  );
}

export async function getPlatformHealth() {
  return discoveryFetch<PlatformHealth>('/platform/health');
}
