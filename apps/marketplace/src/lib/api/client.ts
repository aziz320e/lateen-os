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

export function fetchExtensions() {
  return apiFetch<import('@/types').ExtensionListing[]>('/api/extensions');
}

export function fetchExtension(extensionId: string) {
  return apiFetch<import('@/types').ExtensionListing>(`/api/extensions/${extensionId}`);
}

export function searchExtensions(query: string, category?: string) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  const qs = params.toString();
  return apiFetch<import('@/types').SearchResult>(`/api/search${qs ? `?${qs}` : ''}`);
}

export function fetchPublishers() {
  return apiFetch<import('@/types').Publisher[]>('/api/publishers');
}

export function fetchReleases(extensionId: string) {
  return apiFetch<import('@/types').Release[]>(`/api/releases?extensionId=${extensionId}`);
}

export function fetchReviews(extensionId: string) {
  return apiFetch<import('@/types').Review[]>(`/api/reviews/${extensionId}`);
}

export function fetchRatings(extensionId: string) {
  return apiFetch<import('@/types').RatingSummary>(`/api/reviews/${extensionId}/ratings`);
}

export function installExtension(extensionId: string) {
  return apiFetch('/api/install', {
    method: 'POST',
    body: JSON.stringify({ extensionId }),
  });
}
