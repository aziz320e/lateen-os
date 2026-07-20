import { publicEnv } from '@/lib/env';

export async function analyticsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${publicEnv.analyticsBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Analytics platform request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
