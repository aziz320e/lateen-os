/**
 * Mission lifecycle — creation and the pending -> running -> completed/failed
 * state machine, persisted through a tenant-scoped in-memory repository.
 *
 * @module mission
 */
import { createInMemoryRepository, type InMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AgentId, Mission, MissionPriority, MissionStatus } from './types.js';

export class MissionNotFoundError extends Error {
  constructor(readonly missionId: string) {
    super(`Mission "${missionId}" not found`);
    this.name = 'MissionNotFoundError';
  }
}

export class InvalidMissionTransitionError extends Error {
  constructor(
    readonly missionId: string,
    readonly from: MissionStatus,
    readonly to: MissionStatus,
  ) {
    super(`Mission "${missionId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidMissionTransitionError';
  }
}

export interface CreateMissionInput {
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly priority: MissionPriority;
}

export type MissionRepository = InMemoryRepository<Mission>;

/** Creates a {@link MissionRepository}. */
export function createMissionRepository(seed?: readonly Mission[]): MissionRepository {
  return createInMemoryRepository<Mission>({ seed });
}

export interface MissionLifecycle {
  create(input: CreateMissionInput): Promise<Mission>;
  assign(organizationId: string, missionId: string, agent: AgentId): Promise<Mission>;
  start(organizationId: string, missionId: string): Promise<Mission>;
  complete(organizationId: string, missionId: string): Promise<Mission>;
  fail(organizationId: string, missionId: string, reason: string): Promise<Mission>;
  get(organizationId: string, missionId: string): Promise<Mission | null>;
  list(organizationId: string): Promise<readonly Mission[]>;
}

function generateMissionId(): string {
  return `mission-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function requireMission(
  repository: MissionRepository,
  organizationId: string,
  missionId: string,
): Promise<Mission> {
  const mission = await repository.findById(organizationId, missionId);
  if (!mission) throw new MissionNotFoundError(missionId);
  return mission;
}

function transition(mission: Mission, to: MissionStatus, allowedFrom: readonly MissionStatus[]): Mission {
  if (!allowedFrom.includes(mission.status)) {
    throw new InvalidMissionTransitionError(mission.id, mission.status, to);
  }
  return { ...mission, status: to, updatedAt: new Date().toISOString() };
}

/** Creates a {@link MissionLifecycle} backed by a {@link MissionRepository}. */
export function createMissionLifecycle(repository: MissionRepository): MissionLifecycle {
  return {
    async create(input) {
      const now = new Date().toISOString();
      const mission: Mission = {
        id: generateMissionId(),
        organizationId: input.organizationId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      await repository.save(mission);
      return mission;
    },

    async assign(organizationId, missionId, agent) {
      const mission = await requireMission(repository, organizationId, missionId);
      const updated: Mission = { ...mission, assignedTo: agent, updatedAt: new Date().toISOString() };
      await repository.save(updated);
      return updated;
    },

    async start(organizationId, missionId) {
      const mission = await requireMission(repository, organizationId, missionId);
      const updated = transition(mission, 'running', ['pending']);
      await repository.save(updated);
      return updated;
    },

    async complete(organizationId, missionId) {
      const mission = await requireMission(repository, organizationId, missionId);
      const updated = transition(mission, 'completed', ['running']);
      await repository.save(updated);
      return updated;
    },

    async fail(organizationId, missionId, reason) {
      const mission = await requireMission(repository, organizationId, missionId);
      const updated: Mission = { ...transition(mission, 'failed', ['pending', 'running']), failureReason: reason };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, missionId) {
      return repository.findById(organizationId, missionId);
    },

    async list(organizationId) {
      return repository.list(organizationId);
    },
  };
}
