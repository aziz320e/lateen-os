import { publicEnv } from '@/lib/env';

const baseUrl = publicEnv.gatewayBaseUrl;

export async function gatewayFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Gateway request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
