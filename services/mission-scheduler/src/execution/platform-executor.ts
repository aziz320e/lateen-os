import type { AppConfig } from '../config/index';
import type { PlatformExecutorPort } from '../domain/ports';
import type { PlatformExecutionResult, ScheduledMission } from '../domain/types';
import { getMissionType } from '../mission/catalog';

/** Dispatches scheduled missions to platform services — no business logic. */
export class MockPlatformExecutor implements PlatformExecutorPort {
  async execute(mission: ScheduledMission): Promise<PlatformExecutionResult> {
    const type = getMissionType(mission.missionType);
    return {
      ok: true,
      externalMissionId: `mock-ext-${mission.id}`,
      message: `Mock execution dispatched to ${type?.targetService ?? 'platform'}`,
    };
  }
}

export class HttpPlatformExecutor implements PlatformExecutorPort {
  constructor(private readonly config: AppConfig) {}

  async execute(mission: ScheduledMission): Promise<PlatformExecutionResult> {
    const type = getMissionType(mission.missionType);
    const service = type?.targetService ?? 'ai-product-manager';

    if (service === 'ai-product-manager' && mission.missionType === 'LAUNCH_PRODUCT') {
      try {
        const response = await fetch(`${this.config.AI_PM_BASE_URL}/api/missions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opportunityTitle: String(mission.payload.title ?? mission.missionType),
            scenario: 'happy_path',
          }),
        });
        if (!response.ok) {
          return { ok: false, message: `AI PM returned ${response.status}` };
        }
        const data = (await response.json()) as { id?: string };
        return { ok: true, externalMissionId: data.id, message: 'Dispatched to AI Product Manager' };
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : 'AI PM unreachable' };
      }
    }

    return {
      ok: true,
      externalMissionId: `scheduled-${mission.id}`,
      message: `Orchestration stub for ${service} — mission ${mission.missionType} queued`,
    };
  }
}

export function createPlatformExecutor(config: AppConfig): PlatformExecutorPort {
  return config.NODE_ENV === 'test' ? new MockPlatformExecutor() : new HttpPlatformExecutor(config);
}
