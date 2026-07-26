/**
 * CEO Engine composition root — wires the mission lifecycle, planner, and
 * dispatcher into a single orchestration facade for delegating missions to
 * specialized executive agents.
 *
 * @module ceo
 */
import { createDispatcher, type Dispatcher } from './dispatcher.js';
import {
  createMissionLifecycle,
  createMissionRepository,
  type CreateMissionInput,
  type MissionLifecycle,
  type MissionRepository,
} from './mission.js';
import { createPlanner, type Planner } from './planner.js';
import type { AgentResult, AgentTask, Mission } from './types.js';

export interface CEOEngineDeps {
  /** Defaults to a fresh in-memory {@link MissionRepository}. */
  readonly missionRepository?: MissionRepository;
}

export interface CEOEngine {
  /** Submits a new mission in the "pending" state. */
  submitMission(input: CreateMissionInput): Promise<Mission>;
  /** Plans, assigns, and starts a pending mission. */
  dispatchMission(organizationId: string, missionId: string): Promise<readonly AgentTask[]>;
  /** Reports an agent's result, completing or failing the owning mission. */
  reportResult(organizationId: string, result: AgentResult): Promise<Mission>;
  getMission(organizationId: string, missionId: string): Promise<Mission | null>;
  listMissions(organizationId: string): Promise<readonly Mission[]>;
}

/** Creates the CEO Engine orchestration facade. */
export function createCEOEngine(deps: CEOEngineDeps = {}): CEOEngine {
  const missionRepository = deps.missionRepository ?? createMissionRepository();
  const missionLifecycle: MissionLifecycle = createMissionLifecycle(missionRepository);
  const planner: Planner = createPlanner();
  const dispatcher: Dispatcher = createDispatcher({ missionLifecycle, planner });

  return {
    submitMission: (input) => missionLifecycle.create(input),
    dispatchMission: (organizationId, missionId) => dispatcher.dispatch(organizationId, missionId),
    reportResult: (organizationId, result) => dispatcher.recordResult(organizationId, result),
    getMission: (organizationId, missionId) => missionLifecycle.get(organizationId, missionId),
    listMissions: (organizationId) => missionLifecycle.list(organizationId),
  };
}
