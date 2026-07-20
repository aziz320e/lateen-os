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

export function fetchDiscoveryRuns() {
  return apiFetch<import('@/types').ProductDiscoveryRun[]>('/api/discovery/runs');
}

export function fetchDiscoveryRun(runId: string) {
  return apiFetch<import('@/types').ProductDiscoveryRun>(`/api/discovery/runs/${runId}`);
}

export function runDiscovery(keywords: string[]) {
  return apiFetch<import('@/types').ProductDiscoveryRun>('/api/discovery/run', {
    method: 'POST',
    body: JSON.stringify({ keywords }),
  });
}

export function fetchRecommendations(runId?: string) {
  const params = runId ? `?runId=${runId}` : '';
  return apiFetch<import('@/types').DiscoveryRecommendation[]>(`/api/discovery/recommendations${params}`);
}

export function fetchProducts() {
  return apiFetch<import('@lateen-os/business-dna').Product[]>('/api/business-dna/products');
}

export function fetchMachines() {
  return apiFetch<import('@lateen-os/business-dna').Machine[]>('/api/business-dna/machines');
}

export function fetchAgents() {
  return apiFetch<import('@lateen-os/business-dna').Agent[]>('/api/business-dna/agents');
}

export function fetchRuntimeTasks() {
  return apiFetch<import('@/types').AiRuntimeTask[]>('/api/runtime/tasks');
}

export function fetchActivity() {
  return apiFetch<import('@/types').ActivityEvent[]>('/api/runtime/activity');
}

export function fetchDecisions() {
  return apiFetch<import('@/types').DecisionRecord[]>('/api/decisions');
}

export function submitDecision(recommendationId: string, action: 'approve' | 'reject') {
  return apiFetch<import('@/types').DecisionRecord>('/api/decisions', {
    method: 'POST',
    body: JSON.stringify({ recommendationId, action }),
  });
}

export function fetchDashboard() {
  return apiFetch<{
    runs: import('@/types').ProductDiscoveryRun[];
    recommendations: import('@/types').DiscoveryRecommendation[];
    tasks: import('@/types').AiRuntimeTask[];
    decisions: import('@/types').DecisionRecord[];
    health: import('@/types').PlatformHealth;
    products: import('@lateen-os/business-dna').Product[];
    machines: import('@lateen-os/business-dna').Machine[];
    missions: import('@lateen-os/launch-product-mission/client').LaunchProductMissionState[];
    missionSummary: {
      activeMissions: number;
      completedMissions: number;
      escalatedMissions: number;
      failedMissions: number;
      latestMission: import('@lateen-os/launch-product-mission/client').LaunchProductMissionState | null;
      averageProgress: number;
    };
  }>('/api/dashboard');
}

export function fetchMissions() {
  return apiFetch<{ missions: import('@lateen-os/launch-product-mission/client').LaunchProductMissionState[] }>('/api/missions');
}

export function startMission(body: {
  opportunityTitle?: string;
  scenario?: 'happy_path' | 'escalation_path' | 'rejected_path' | 'retry_path';
}) {
  return apiFetch<import('@lateen-os/launch-product-mission/client').LaunchProductMissionState>('/api/missions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
