import { fetchMissions } from '@/lib/api/ai-pm-server';
import { getMissionProgress } from '@lateen-os/launch-product-mission/client';
import type { MissionView } from '@/types';

export async function listMissionViews(): Promise<MissionView[]> {
  const missions = await fetchMissions();
  return missions.map((m) => ({
    id: m.id,
    title: m.title,
    status: m.status,
    progress: getMissionProgress(m),
    scenario: m.scenario,
    updatedAt: m.completedAt ?? m.startedAt,
  }));
}

export function groupMissionsByStatus(missions: MissionView[]) {
  return {
    running: missions.filter((m) => m.status === 'active'),
    completed: missions.filter((m) => m.status === 'completed'),
    paused: missions.filter((m) => m.status === 'planning'),
    failed: missions.filter((m) => m.status === 'failed' || m.status === 'escalated' || m.status === 'cancelled'),
  };
}
