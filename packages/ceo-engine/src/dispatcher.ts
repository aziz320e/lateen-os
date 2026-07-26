/**
 * Dispatcher — plans and assigns a pending {@link Mission}'s tasks, moving
 * it into "running", and applies {@link AgentResult}s back onto the mission
 * lifecycle as it completes or fails.
 *
 * @module dispatcher
 */
import { MissionNotFoundError, type MissionLifecycle } from './mission.js';
import type { Planner } from './planner.js';
import type { AgentResult, AgentTask, Mission } from './types.js';

export interface DispatcherDeps {
  readonly missionLifecycle: MissionLifecycle;
  readonly planner: Planner;
}

export interface Dispatcher {
  /** Plans a mission's tasks, assigns the lead agent, and starts the mission. */
  dispatch(organizationId: string, missionId: string): Promise<readonly AgentTask[]>;
  /** Applies an {@link AgentResult} to its owning mission, completing or failing it. */
  recordResult(organizationId: string, result: AgentResult): Promise<Mission>;
}

/** Creates a {@link Dispatcher}. */
export function createDispatcher(deps: DispatcherDeps): Dispatcher {
  return {
    async dispatch(organizationId, missionId) {
      const mission = await deps.missionLifecycle.get(organizationId, missionId);
      if (!mission) throw new MissionNotFoundError(missionId);

      const tasks = deps.planner.plan(mission);
      const [leadTask] = tasks;
      if (leadTask) {
        await deps.missionLifecycle.assign(organizationId, missionId, leadTask.agent);
      }
      if (mission.status === 'pending') {
        await deps.missionLifecycle.start(organizationId, missionId);
      }
      return tasks;
    },

    async recordResult(organizationId, result) {
      return result.success
        ? deps.missionLifecycle.complete(organizationId, result.missionId)
        : deps.missionLifecycle.fail(organizationId, result.missionId, result.message);
    },
  };
}
