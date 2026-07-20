import { serverEnv } from '@/lib/env';
import type { LaunchProductMissionState } from '@lateen-os/launch-product-mission/client';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_AI_PM_BASE_URL;

export async function fetchMissions(): Promise<LaunchProductMissionState[]> {
  try {
    const response = await fetch(`${baseUrl}/api/missions`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = (await response.json()) as { missions: LaunchProductMissionState[] };
    return data.missions ?? [];
  } catch {
    return [];
  }
}

export async function startMission(input: { opportunityTitle?: string; scenario?: string }) {
  const response = await fetch(`${baseUrl}/api/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`AI PM mission start failed: ${response.status}`);
  return response.json() as Promise<LaunchProductMissionState>;
}

export async function fetchDecisions() {
  try {
    const response = await fetch(`${baseUrl}/api/decisions`, { cache: 'no-store' });
    if (!response.ok) return [];
    return (await response.json()) as Record<string, unknown>[];
  } catch {
    return [];
  }
}

export async function approveDecision(recommendationId: string) {
  const response = await fetch(`${baseUrl}/api/decisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendationId, action: 'approve' }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Decision approve failed: ${response.status}`);
  return response.json();
}

export async function fetchDashboardSummary() {
  try {
    const response = await fetch(`${baseUrl}/api/dashboard`, { cache: 'no-store' });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
