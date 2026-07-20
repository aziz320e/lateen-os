import { serverEnv } from '@/lib/env';

export async function provisioningFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${serverEnv.NEXT_PUBLIC_LATEEN_PROVISIONING_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchProfiles() {
  return provisioningFetch<Array<{ id: string; displayName: string; description: string }>>('/api/profiles');
}

export function startProvisioning(body: Record<string, unknown>) {
  return provisioningFetch('/api/provision', { method: 'POST', body: JSON.stringify(body) });
}

export function fetchProvisioningJob(id: string) {
  return provisioningFetch(`/api/provision/${id}`);
}
