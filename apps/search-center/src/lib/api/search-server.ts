import { publicEnv } from '@/lib/env';

export async function searchFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${publicEnv.searchBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Search platform request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
