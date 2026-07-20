/** Browser-safe exports — no Node.js built-ins. */

export type {
  LaunchProductMissionEvent,
  LaunchProductMissionOutputs,
  LaunchProductMissionState,
  LaunchProductStageCode,
  LaunchProductStageDefinition,
  LaunchProductStageState,
  LaunchProductStageStatus,
  SimulationScenario,
} from './types.js';

import type { LaunchProductMissionState } from './types.js';

export function getMissionProgress(mission: LaunchProductMissionState): number {
  const completed = mission.stages.filter((s) => s.status === 'completed').length;
  return Math.round((completed / mission.stages.length) * 100);
}
