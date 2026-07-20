import { serverEnv } from '@/lib/env';
import type { LaunchProductMissionState } from '@lateen-os/launch-product-mission/client';

export async function fetchMissionsFromAiPm(): Promise<LaunchProductMissionState[]> {
  const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_AI_PM_BASE_URL;
  try {
    const response = await fetch(`${baseUrl}/api/missions`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = (await response.json()) as { missions: LaunchProductMissionState[] };
    return data.missions ?? [];
  } catch {
    return [];
  }
}

export async function fetchMissionSummaryFromAiPm() {
  const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_AI_PM_BASE_URL;
  try {
    const response = await fetch(`${baseUrl}/api/dashboard`, { cache: 'no-store' });
    if (!response.ok) {
      return { activeMissions: 0, completedMissions: 0, escalatedMissions: 0, failedMissions: 0, averageProgress: 0, latestMission: null };
    }
    const data = await response.json();
    return data.missionSummary ?? { activeMissions: 0, completedMissions: 0, escalatedMissions: 0, failedMissions: 0, averageProgress: 0, latestMission: null };
  } catch {
    return { activeMissions: 0, completedMissions: 0, escalatedMissions: 0, failedMissions: 0, averageProgress: 0, latestMission: null };
  }
}

export async function fetchDecisionsFromAiPm() {
  const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_AI_PM_BASE_URL;
  try {
    const response = await fetch(`${baseUrl}/api/dashboard`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return data.decisions ?? [];
  } catch {
    return [];
  }
}
