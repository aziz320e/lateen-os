import { describe, expect, it } from 'vitest';
import { createDispatcher } from '../src/dispatcher.js';
import { createMissionLifecycle, createMissionRepository, MissionNotFoundError } from '../src/mission.js';
import { createPlanner } from '../src/planner.js';

const ORG = 'org-1';

function setup() {
  const missionLifecycle = createMissionLifecycle(createMissionRepository());
  const planner = createPlanner();
  const dispatcher = createDispatcher({ missionLifecycle, planner });
  return { missionLifecycle, dispatcher };
}

describe('createDispatcher', () => {
  it('dispatch plans tasks, assigns the lead agent, and starts the mission', async () => {
    const { missionLifecycle, dispatcher } = setup();
    const mission = await missionLifecycle.create({
      organizationId: ORG,
      title: 'Grow organic traffic',
      description: 'Improve SEO rankings',
      priority: 'high',
    });

    const tasks = await dispatcher.dispatch(ORG, mission.id);
    expect(tasks.length).toBeGreaterThan(0);

    const updated = await missionLifecycle.get(ORG, mission.id);
    expect(updated?.status).toBe('running');
    expect(updated?.assignedTo).toBe(tasks[0]?.agent);
  });

  it('dispatch throws for an unknown mission', async () => {
    const { dispatcher } = setup();
    await expect(dispatcher.dispatch(ORG, 'missing')).rejects.toBeInstanceOf(MissionNotFoundError);
  });

  it('recordResult completes the mission on success', async () => {
    const { missionLifecycle, dispatcher } = setup();
    const mission = await missionLifecycle.create({
      organizationId: ORG,
      title: 'Reforecast budget',
      description: 'finance review',
      priority: 'medium',
    });
    await dispatcher.dispatch(ORG, mission.id);

    const result = await dispatcher.recordResult(ORG, { missionId: mission.id, success: true, message: 'done' });
    expect(result.status).toBe('completed');
  });

  it('recordResult fails the mission with the result message on failure', async () => {
    const { missionLifecycle, dispatcher } = setup();
    const mission = await missionLifecycle.create({
      organizationId: ORG,
      title: 'Reforecast budget',
      description: 'finance review',
      priority: 'medium',
    });
    await dispatcher.dispatch(ORG, mission.id);

    const result = await dispatcher.recordResult(ORG, { missionId: mission.id, success: false, message: 'model timeout' });
    expect(result.status).toBe('failed');
    expect(result.failureReason).toBe('model timeout');
  });
});
