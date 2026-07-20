import { getAuthHeaders, getOrganizationId } from '@/lib/auth';
import { serverEnv } from '@/lib/env';
import type { DiscoveryRecommendation, PlatformHealthSnapshot, ProductDiscoveryRun } from '@/types';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_PRODUCT_DISCOVERY_BASE_URL;

async function discoveryFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Discovery API ${response.status}: ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function listDiscoveryRuns() {
  const orgId = getOrganizationId();
  return discoveryFetch<ProductDiscoveryRun[]>(`/api/v1/discovery/runs?organizationId=${orgId}`).catch(() => []);
}

export async function listRecommendations(limit = 50) {
  const orgId = getOrganizationId();
  return discoveryFetch<DiscoveryRecommendation[]>(
    `/api/v1/discovery/recommendations?organizationId=${orgId}&limit=${limit}`,
  ).catch(() => []);
}

export async function getDiscoveryPlatformHealth() {
  return discoveryFetch<{ status: string; services: { name: string; status: string }[] }>('/platform/health').catch(
    () => ({ status: 'degraded', services: [] }),
  );
}
