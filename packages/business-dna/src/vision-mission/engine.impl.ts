/**
 * Real Vision & Mission Engine — a singleton-per-organization vision,
 * mission, values, and strategic objectives, with a guarded objective
 * status state machine.
 *
 * @module vision-mission/engine.impl
 */
import { InvalidObjectiveTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { VisionMissionRepository } from './repository.js';
import type { StrategicObjective, StrategicObjectiveId, StrategicObjectiveStatus, VisionMission } from './types.js';

const OBJECTIVE_TRANSITIONS: Readonly<Record<StrategicObjectiveStatus, readonly StrategicObjectiveStatus[]>> = {
  planned: ['in_progress', 'abandoned'],
  in_progress: ['achieved', 'abandoned'],
  achieved: [],
  abandoned: [],
};

export function canTransitionObjective(from: StrategicObjectiveStatus, to: StrategicObjectiveStatus): boolean {
  return OBJECTIVE_TRANSITIONS[from].includes(to);
}

export interface SetVisionMissionInput {
  readonly vision: string;
  readonly mission: string;
  readonly values?: readonly string[];
}

export interface AddStrategicObjectiveInput {
  readonly title: string;
  readonly description?: string;
  readonly targetDate?: string;
}

export interface VisionMissionEngine {
  setVisionMission(organizationId: OrganizationId, input: SetVisionMissionInput): Promise<VisionMission>;
  addStrategicObjective(organizationId: OrganizationId, input: AddStrategicObjectiveInput): Promise<VisionMission>;
  updateObjectiveStatus(
    organizationId: OrganizationId,
    objectiveId: StrategicObjectiveId,
    status: StrategicObjectiveStatus,
  ): Promise<VisionMission>;
  get(organizationId: OrganizationId): Promise<VisionMission | null>;
}

/** Creates a real {@link VisionMissionEngine} backed by a {@link VisionMissionRepository}. */
export function createVisionMissionEngine(repository: VisionMissionRepository, now: () => string = nowIso): VisionMissionEngine {
  async function getOrCreate(organizationId: OrganizationId): Promise<VisionMission> {
    const existing = await repository.findByOrganization(organizationId);
    if (existing) return existing;
    const timestamp = now();
    const created: VisionMission = {
      id: organizationId,
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      vision: '',
      mission: '',
      values: [],
      strategicObjectives: [],
    };
    await repository.save(created);
    return created;
  }

  return {
    async setVisionMission(organizationId, input) {
      const current = await getOrCreate(organizationId);
      const updated: VisionMission = {
        ...current,
        vision: input.vision,
        mission: input.mission,
        values: input.values ?? current.values,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async addStrategicObjective(organizationId, input) {
      const current = await getOrCreate(organizationId);
      const objective: StrategicObjective = {
        objectiveId: generateId('objective'),
        title: input.title,
        description: input.description,
        targetDate: input.targetDate,
        status: 'planned',
      };
      const updated: VisionMission = {
        ...current,
        strategicObjectives: [...current.strategicObjectives, objective],
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async updateObjectiveStatus(organizationId, objectiveId, status) {
      const current = await getOrCreate(organizationId);
      const objective = current.strategicObjectives.find((candidate) => candidate.objectiveId === objectiveId);
      if (!objective) throw new InvalidObjectiveTransitionError(objectiveId, 'unknown', status);
      if (!canTransitionObjective(objective.status, status)) {
        throw new InvalidObjectiveTransitionError(objectiveId, objective.status, status);
      }
      const updated: VisionMission = {
        ...current,
        strategicObjectives: current.strategicObjectives.map((candidate) =>
          candidate.objectiveId === objectiveId ? { ...candidate, status } : candidate,
        ),
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId) {
      return repository.findByOrganization(organizationId);
    },
  };
}
