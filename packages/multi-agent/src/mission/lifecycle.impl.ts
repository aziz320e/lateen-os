/**
 * Real Mission lifecycle — the top-level multi-agent collaboration unit's
 * state machine.
 *
 * @module mission/lifecycle.impl
 */
import type { CollaborationEventBus } from '../events/collaboration-event-bus.js';
import { InvalidMissionTransitionError, MissionNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { MissionRepository } from './repository.js';
import type { Mission, MissionContext, MissionId, MissionPriority, MissionStatus } from './types.js';
import type { MissionWorkerRole } from '../shared/primitives.js';

const MISSION_TRANSITIONS: Readonly<Record<MissionStatus, readonly MissionStatus[]>> = {
  draft: ['planning', 'cancelled'],
  planning: ['active', 'cancelled'],
  active: ['negotiating', 'awaiting_consensus', 'awaiting_review', 'escalated', 'completed', 'failed', 'cancelled'],
  negotiating: ['active', 'awaiting_consensus', 'escalated', 'failed', 'cancelled'],
  awaiting_consensus: ['active', 'escalated', 'failed', 'cancelled'],
  awaiting_review: ['active', 'escalated', 'failed', 'cancelled'],
  escalated: ['active', 'failed', 'cancelled'],
  completed: [],
  cancelled: [],
  failed: [],
};

export function canTransitionMission(from: MissionStatus, to: MissionStatus): boolean {
  return MISSION_TRANSITIONS[from].includes(to);
}

export interface CreateMissionInput {
  readonly organizationId: OrganizationId;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly priority: MissionPriority;
  readonly leadWorkerRole: MissionWorkerRole;
  readonly context?: Partial<Omit<MissionContext, 'missionId'>>;
}

export interface MissionLifecycle {
  create(input: CreateMissionInput): Promise<Mission>;
  transition(organizationId: OrganizationId, missionId: MissionId, to: MissionStatus): Promise<Mission>;
  start(organizationId: OrganizationId, missionId: MissionId): Promise<Mission>;
  complete(organizationId: OrganizationId, missionId: MissionId): Promise<Mission>;
  cancel(organizationId: OrganizationId, missionId: MissionId): Promise<Mission>;
  fail(organizationId: OrganizationId, missionId: MissionId): Promise<Mission>;
  get(organizationId: OrganizationId, missionId: MissionId): Promise<Mission | null>;
  list(organizationId: OrganizationId): Promise<readonly Mission[]>;
}

/** Creates a real {@link MissionLifecycle} backed by a {@link MissionRepository}. */
export function createMissionLifecycle(repository: MissionRepository, eventBus?: CollaborationEventBus): MissionLifecycle {
  async function requireMission(organizationId: OrganizationId, missionId: MissionId): Promise<Mission> {
    const mission = await repository.findById(organizationId, missionId);
    if (!mission) throw new MissionNotFoundError(missionId);
    return mission;
  }

  async function transition(organizationId: OrganizationId, missionId: MissionId, to: MissionStatus): Promise<Mission> {
    const mission = await requireMission(organizationId, missionId);
    if (!canTransitionMission(mission.status, to)) {
      throw new InvalidMissionTransitionError(missionId, mission.status, to);
    }
    const now = nowIso();
    const updated: Mission = {
      ...mission,
      status: to,
      updatedAt: now,
      startedAt: to === 'active' && !mission.startedAt ? now : mission.startedAt,
      completedAt: to === 'completed' || to === 'failed' || to === 'cancelled' ? now : mission.completedAt,
    };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(input) {
      const now = nowIso();
      const missionId = generateId('mission');
      const mission: Mission = {
        id: missionId,
        organizationId: input.organizationId,
        createdAt: now,
        updatedAt: now,
        code: input.code,
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: 'draft',
        objectiveIds: [],
        context: {
          missionId,
          decisionIds: [],
          businessDnaReferences: [],
          metadata: {},
          ...input.context,
        },
        leadWorkerRole: input.leadWorkerRole,
      };
      await repository.save(mission);
      return mission;
    },

    transition,

    async start(organizationId, missionId) {
      const mission = await requireMission(organizationId, missionId);
      if (mission.status === 'draft') {
        await transition(organizationId, missionId, 'planning');
      }
      const started = await transition(organizationId, missionId, 'active');
      eventBus?.publish('mission.started', { missionId, code: started.code });
      return started;
    },

    async complete(organizationId, missionId) {
      const completed = await transition(organizationId, missionId, 'completed');
      eventBus?.publish('mission.completed', { missionId, success: true });
      return completed;
    },

    async cancel(organizationId, missionId) {
      return transition(organizationId, missionId, 'cancelled');
    },

    async fail(organizationId, missionId) {
      const failed = await transition(organizationId, missionId, 'failed');
      eventBus?.publish('mission.completed', { missionId, success: false });
      return failed;
    },

    async get(organizationId, missionId) {
      return repository.findById(organizationId, missionId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
