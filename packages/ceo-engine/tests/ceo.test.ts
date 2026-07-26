import { describe, expect, it } from 'vitest';
import { createCEOEngine } from '../src/ceo.js';

const ORG = 'org-1';

describe('createCEOEngine', () => {
  it('runs a mission end to end: submit -> dispatch -> report success', async () => {
    const ceo = createCEOEngine();

    const mission = await ceo.submitMission({
      organizationId: ORG,
      title: 'Launch product feature',
      description: 'Ship the new roadmap item',
      priority: 'high',
    });
    expect(mission.status).toBe('pending');

    const tasks = await ceo.dispatchMission(ORG, mission.id);
    expect(tasks.length).toBeGreaterThan(0);

    const completed = await ceo.reportResult(ORG, { missionId: mission.id, success: true, message: 'shipped' });
    expect(completed.status).toBe('completed');

    const fetched = await ceo.getMission(ORG, mission.id);
    expect(fetched?.status).toBe('completed');
  });

  it('fails a mission when its agent reports failure', async () => {
    const ceo = createCEOEngine();
    const mission = await ceo.submitMission({
      organizationId: ORG,
      title: 'Close enterprise deal',
      description: 'sales pipeline follow-up',
      priority: 'critical',
    });
    await ceo.dispatchMission(ORG, mission.id);

    const failed = await ceo.reportResult(ORG, { missionId: mission.id, success: false, message: 'lead went cold' });
    expect(failed.status).toBe('failed');
    expect(failed.failureReason).toBe('lead went cold');
  });

  it('listMissions returns every mission submitted for an organization', async () => {
    const ceo = createCEOEngine();
    await ceo.submitMission({ organizationId: ORG, title: 'A', description: 'a', priority: 'low' });
    await ceo.submitMission({ organizationId: ORG, title: 'B', description: 'b', priority: 'low' });

    const missions = await ceo.listMissions(ORG);
    expect(missions).toHaveLength(2);
  });
});
