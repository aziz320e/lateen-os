import { describe, expect, it } from 'vitest';
import { createMissionLifecycle, createMissionRepository, InvalidMissionTransitionError, MissionNotFoundError } from '../src/mission.js';
import type { CreateMissionInput } from '../src/mission.js';

const ORG = 'org-1';

function makeInput(overrides: Partial<CreateMissionInput> = {}): CreateMissionInput {
  return {
    organizationId: ORG,
    title: 'Grow organic traffic',
    description: 'Improve SEO rankings for key product pages',
    priority: 'high',
    ...overrides,
  };
}

describe('createMissionLifecycle', () => {
  it('create starts a mission in "pending" status', async () => {
    const lifecycle = createMissionLifecycle(createMissionRepository());
    const mission = await lifecycle.create(makeInput());

    expect(mission.status).toBe('pending');
    expect(mission.organizationId).toBe(ORG);
    expect(mission.assignedTo).toBeUndefined();
  });

  it('assign sets the assigned agent without changing status', async () => {
    const lifecycle = createMissionLifecycle(createMissionRepository());
    const mission = await lifecycle.create(makeInput());

    const assigned = await lifecycle.assign(ORG, mission.id, 'seo');
    expect(assigned.assignedTo).toBe('seo');
    expect(assigned.status).toBe('pending');
  });

  it('start transitions pending -> running', async () => {
    const lifecycle = createMissionLifecycle(createMissionRepository());
    const mission = await lifecycle.create(makeInput());

    const started = await lifecycle.start(ORG, mission.id);
    expect(started.status).toBe('running');
  });

  it('complete transitions running -> completed', async () => {
    const lifecycle = createMissionLifecycle(createMissionRepository());
    const mission = await lifecycle.create(makeInput());
    await lifecycle.start(ORG, mission.id);

    const completed = await lifecycle.complete(ORG, mission.id);
    expect(completed.status).toBe('completed');
  });

  it('fail transitions pending or running -> failed and records the reason', async () => {
    const lifecycle = createMissionLifecycle(createMissionRepository());
    const mission = await lifecycle.create(makeInput());

    const failed = await lifecycle.fail(ORG, mission.id, 'agent unavailable');
    expect(failed.status).toBe('failed');
    expect(failed.failureReason).toBe('agent unavailable');
  });

  it('rejects invalid transitions', async () => {
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

  it('list scopes missions to their organization', async () => {
    const lifecycle = createMissionLifecycle(createMissionRepository());
    await lifecycle.create(makeInput({ organizationId: ORG }));
    await lifecycle.create(makeInput({ organizationId: 'org-2' }));

    const missions = await lifecycle.list(ORG);
    expect(missions).toHaveLength(1);
  });
});
