'use client';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchProfiles() {
  return apiFetch<Array<{ id: string; displayName: string; description: string }>>('/api/profiles');
}

export function startProvisioning(body: Record<string, unknown>) {
  return apiFetch('/api/provision', { method: 'POST', body: JSON.stringify(body) });
}

export function fetchProvisioningJob(id: string) {
  return apiFetch(`/api/provision/${id}`);
}
