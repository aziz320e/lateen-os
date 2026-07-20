import {
  simulateLaunchProductMission,
  type LaunchProductMissionState,
  type SimulationScenario,
} from '@lateen-os/launch-product-mission';

const missions = new Map<string, LaunchProductMissionState>();

export function listMissions(): LaunchProductMissionState[] {
  return [...missions.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function getMission(id: string): LaunchProductMissionState | undefined {
  return missions.get(id);
}

export function startMission(options: {
  opportunityTitle?: string;
  scenario?: SimulationScenario;
  organizationId?: string;
}): LaunchProductMissionState {
  const { mission } = simulateLaunchProductMission(options);
  missions.set(mission.id, mission);
  return mission;
}

export function getMissionSummary() {
  const all = listMissions();
  const active = all.filter((m) => m.status === 'active' || m.status === 'escalated').length;
  const completed = all.filter((m) => m.status === 'completed').length;
  const escalated = all.filter((m) => m.status === 'escalated').length;
  const failed = all.filter((m) => m.status === 'failed').length;
  const latest = all[0] ?? null;
  const averageProgress =
    all.length === 0
      ? 0
      : Math.round(
          all.reduce((sum, m) => {
            const done = m.stages.filter((s) => s.status === 'completed').length;
            return sum + (done / m.stages.length) * 100;
          }, 0) / all.length,
        );
  return { activeMissions: active, completedMissions: completed, escalatedMissions: escalated, failedMissions: failed, latestMission: latest, averageProgress };
}
