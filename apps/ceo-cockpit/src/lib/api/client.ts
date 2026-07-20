import type {
  DecisionRecord,
  DiscoveryRecommendation,
  ExecutiveDashboard,
  MemoryEntryView,
  NotificationItem,
  PlatformHealthSnapshot,
  ProductDiscoveryRun,
} from '@/types';
import type { LaunchProductMissionState } from '@lateen-os/launch-product-mission/client';
import type { AiWorkerView, WorkflowView } from '@/types';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchDashboard() {
  return apiFetch<ExecutiveDashboard>('/api/dashboard');
}

export function fetchPlatformHealth() {
  return apiFetch<PlatformHealthSnapshot>('/api/platform/health');
}

export function fetchMissions() {
  return apiFetch<{ missions: LaunchProductMissionState[]; summary: ExecutiveDashboard['missionSummary'] }>('/api/missions');
}

export function fetchWorkforce() {
  return apiFetch<{ workers: AiWorkerView[] }>('/api/workforce');
}

export function fetchDecisions() {
  return apiFetch<{ decisions: DecisionRecord[]; policies: Record<string, unknown>[] }>('/api/decisions');
}

export function fetchMemory() {
  return apiFetch<{ entries: MemoryEntryView[] }>('/api/memory');
}

export function fetchWorkflows() {
  return apiFetch<{ workflows: WorkflowView[] }>('/api/workflows');
}

export function fetchNotifications() {
  return apiFetch<{ notifications: NotificationItem[] }>('/api/notifications');
}

export function fetchOrganization() {
  return apiFetch<{
    organization: { id: string; name: string } | null;
    counts: ExecutiveDashboard['counts'];
    departments: Record<string, unknown>[];
    employees: Record<string, unknown>[];
    machines: Record<string, unknown>[];
    branches: Record<string, unknown>[];
  }>('/api/organization');
}

export function fetchDiscoveryRuns() {
  return apiFetch<{ runs: ProductDiscoveryRun[]; recommendations: DiscoveryRecommendation[] }>('/api/discovery/summary');
}
