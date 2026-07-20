import { publicEnv } from '@/lib/env';

export async function cloudFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${publicEnv.cloudBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Cloud control plane request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
