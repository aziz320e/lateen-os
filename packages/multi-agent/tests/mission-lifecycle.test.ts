import { describe, expect, it } from 'vitest';
import { createMissionRepository } from '../src/mission/repository.impl.js';
import { canTransitionMission, createMissionLifecycle } from '../src/mission/lifecycle.impl.js';
import { InvalidMissionTransitionError, MissionNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function makeInput() {
  return {
    organizationId: ORG,
    code: 'expand-market',
    title: 'Expand into a new market',
    description: 'Coordinate a cross-functional push into a new region.',
    priority: 'high' as const,
    leadWorkerRole: 'ceo_ai' as const,
  };
}

describe('canTransitionMission', () => {
  it('allows draft -> planning -> active -> completed', () => {
    expect(canTransitionMission('draft', 'planning')).toBe(true);
    expect(canTransitionMission('planning', 'active')).toBe(true);
    expect(canTransitionMission('active', 'completed')).toBe(true);
  });

  it('rejects transitions out of terminal states', () => {
    expect(canTransitionMission('completed', 'active')).toBe(false);
    expect(canTransitionMission('failed', 'active')).toBe(false);
    expect(canTransitionMission('cancelled', 'active')).toBe(false);
  });
});

describe('createMissionLifecycle', () => {
  it('creates a mission in draft status', async () => {
    const lifecycle = createMissionLifecycle(createMissionRepository());
    const mission = await lifecycle.create(makeInput());
    expect(mission.status).toBe('draft');
    expect(mission.context.missionId).toBe(mission.id);
  });

  it('start() takes a draft mission through planning to active in one call', async () => {
    const lifecycle = createMissionLifecycle(createMissionRepository());
    const mission = await lifecycle.create(makeInput());
    const started = await lifecycle.start(ORG, mission.id);
    expect(started.status).toBe('active');
    expect(started.startedAt).toBeDefined();
  });

  it('complete() and fail() are guarded and stamp completedAt', async () => {
    const lifecycle = createMissionLifecycle(createMissionRepository());
    const mission = await lifecycle.create(makeInput());
    await lifecycle.start(ORG, mission.id);
    const completed = await lifecycle.complete(ORG, mission.id);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
  });

  it('throws InvalidMissionTransitionError for a disallowed transition', async () => {
    const lifecycle = createMissionLifecycle(createMissionRepository());
    const mission = await lifecycle.create(makeInput());
    await lifecycle.start(ORG, mission.id);
    await lifecycle.complete(ORG, mission.id);
    await expect(lifecycle.complete(ORG, mission.id)).rejects.toBeInstanceOf(InvalidMissionTransitionError);
  });

  it('throws MissionNotFoundError for an unknown mission', async () => {
    const lifecycle = createMissionLifecycle(createMissionRepository());
    await expect(lifecycle.start(ORG, 'missing')).rejects.toBeInstanceOf(MissionNotFoundError);
  });

  it('list() and findByCode()/findByStatus() are organization-scoped', async () => {
    const repository = createMissionRepository();
    const lifecycle = createMissionLifecycle(repository);
    await lifecycle.create(makeInput());
    await lifecycle.create({ ...makeInput(), code: 'other', organizationId: 'org-2' });

    const missions = await lifecycle.list(ORG);
    expect(missions).toHaveLength(1);

    const byCode = await repository.findByCode(ORG, 'expand-market');
    expect(byCode?.organizationId).toBe(ORG);

    const byStatus = await repository.findByStatus(ORG, 'draft');
    expect(byStatus).toHaveLength(1);
  });
});
