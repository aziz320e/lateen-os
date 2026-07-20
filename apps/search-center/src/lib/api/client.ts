export interface SearchHit {
  id: string;
  source: string;
  title: string;
  description?: string;
  entityType?: string;
  score: number;
  highlights: { field: string; snippet: string }[];
}

export interface SearchResponse {
  query: string;
  mode: string;
  intent: string;
  total: number;
  hits: SearchHit[];
  latencyMs: number;
}

export async function executeSearch(query: string, mode = 'hybrid', organizationId = 'org-1'): Promise<SearchResponse> {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, mode, filters: { organizationId }, userId: 'demo-user' }),
  });
  if (!response.ok) throw new Error('Search failed');
  return response.json() as Promise<SearchResponse>;
}

export async function fetchRecent(): Promise<{ query: string; searchedAt: string; hitCount: number }[]> {
  const response = await fetch('/api/search/recent');
  if (!response.ok) throw new Error('Failed to load recent');
  return response.json();
}

export async function fetchSaved(): Promise<{ id: string; name: string; query: string; pinned: boolean }[]> {
  const response = await fetch('/api/search/saved');
  if (!response.ok) throw new Error('Failed to load saved');
  return response.json();
}

export async function fetchIndexes(): Promise<{ source: string; name: string; documentCount: number; status: string }[]> {
  const response = await fetch('/api/search/indexes');
  if (!response.ok) throw new Error('Failed to load indexes');
  return response.json();
}
