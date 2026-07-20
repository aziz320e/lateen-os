/** Launch Product mission domain events. */
import type { LaunchProductMissionEvent, LaunchProductStageCode } from './types.js';
export const LAUNCH_PRODUCT_EVENT_NAMES = {
  MissionStarted: 'MissionStarted',
  MissionStageCompleted: 'MissionStageCompleted',
  MissionEscalated: 'MissionEscalated',
  ConsensusReached: 'ConsensusReached',
  DecisionApproved: 'DecisionApproved',
  MissionCompleted: 'MissionCompleted',
} as const;

export type LaunchProductEventName = (typeof LAUNCH_PRODUCT_EVENT_NAMES)[keyof typeof LAUNCH_PRODUCT_EVENT_NAMES];

export function createMissionEvent(
  eventName: LaunchProductEventName,
  missionId: string,
  payload: Record<string, unknown>,
  stageCode?: LaunchProductStageCode,
): LaunchProductMissionEvent {
  return {
    eventName,
    occurredAt: new Date().toISOString(),
    missionId,
    stageCode,
    payload,
  };
}
