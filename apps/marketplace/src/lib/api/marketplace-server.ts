import { serverEnv } from '@/lib/env';

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-organization-id': serverEnv.LATEEN_ORG_ID,
  };
}

export async function marketplaceFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_MARKETPLACE_BASE_URL;
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...getHeaders(), ...init?.headers },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Marketplace request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchExtensions() {
  return marketplaceFetch<import('@/types').ExtensionListing[]>('/api/extensions');
}

export function fetchExtension(extensionId: string) {
  return marketplaceFetch<import('@/types').ExtensionListing>(`/api/extensions/${extensionId}`);
}

export function searchExtensions(query: string, category?: string) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  const qs = params.toString();
  return marketplaceFetch<import('@/types').SearchResult>(`/api/search${qs ? `?${qs}` : ''}`);
}

export function fetchPublishers() {
  return marketplaceFetch<import('@/types').Publisher[]>('/api/publishers');
}

export function fetchReleases(extensionId: string) {
  return marketplaceFetch<import('@/types').Release[]>(`/api/releases?extensionId=${extensionId}`);
}

export function fetchReviews(extensionId: string) {
  return marketplaceFetch<import('@/types').Review[]>(`/api/reviews/${extensionId}`);
}

export function fetchRatings(extensionId: string) {
  return marketplaceFetch<import('@/types').RatingSummary>(`/api/reviews/${extensionId}/ratings`);
}

export function installExtension(extensionId: string, version?: string) {
  return marketplaceFetch('/api/install', {
    method: 'POST',
    body: JSON.stringify({ extensionId, version, approvePermissions: [] }),
  });
}
