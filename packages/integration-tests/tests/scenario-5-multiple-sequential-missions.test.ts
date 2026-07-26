/**
 * Scenario 5 — multiple sequential missions against one long-lived
 * `LateenSystem` instance, verifying the in-memory mission repository
 * accumulates state correctly across a mixed sequence of outcomes and
 * stays isolated per organization.
 */
import { describe, expect, it } from 'vitest';
import { createLateen } from '@lateen-os/sdk';

const ORG = 'org-scenario-5';
const OTHER_ORG = 'org-scenario-5-other';

describe('Scenario 5: multiple sequential missions', () => {
  it('processes three sequential missions with mixed outcomes and lists them all correctly', async () => {
    const system = createLateen();

    const missionA = await system.ceo.submitMission({
      organizationId: ORG,
      title: 'Launch SEO campaign',
      description: 'Improve organic rankings for flagship products.',
      priority: 'medium',
    });
    await system.ceo.dispatchMission(ORG, missionA.id);
    await system.ceo.reportResult(ORG, { missionId: missionA.id, success: true, message: 'Campaign launched' });

    const missionB = await system.ceo.submitMission({
      organizationId: ORG,
      title: 'Renegotiate supplier contract',
      description: 'Reduce material costs for Q3.',
      priority: 'high',
    });
    await system.ceo.dispatchMission(ORG, missionB.id);
    await system.ceo.reportResult(ORG, { missionId: missionB.id, success: false, message: 'Supplier declined' });

    const missionC = await system.ceo.submitMission({
      organizationId: ORG,
      title: 'Update onboarding workflow',
      description: 'Streamline new-hire onboarding steps.',
      priority: 'low',
    });
    await system.ceo.dispatchMission(ORG, missionC.id);
    await system.ceo.reportResult(ORG, { missionId: missionC.id, success: true, message: 'Workflow updated' });

    const missions = await system.ceo.listMissions(ORG);
    expect(missions).toHaveLength(3);

    const ids = missions.map((mission) => mission.id);
    expect(new Set(ids).size).toBe(3); // every mission has a unique id

    const byId = new Map(missions.map((mission) => [mission.id, mission]));
    expect(byId.get(missionA.id)?.status).toBe('completed');
    expect(byId.get(missionB.id)?.status).toBe('failed');
    expect(byId.get(missionB.id)?.failureReason).toBe('Supplier declined');
    expect(byId.get(missionC.id)?.status).toBe('completed');
  });

  it('keeps missions isolated per organization within the same system instance', async () => {
    const system = createLateen();

    await system.ceo.submitMission({ organizationId: ORG, title: 'A', description: 'a', priority: 'low' });
    await system.ceo.submitMission({ organizationId: ORG, title: 'B', description: 'b', priority: 'low' });
    await system.ceo.submitMission({ organizationId: OTHER_ORG, title: 'C', description: 'c', priority: 'low' });

    const orgMissions = await system.ceo.listMissions(ORG);
    const otherOrgMissions = await system.ceo.listMissions(OTHER_ORG);

    expect(orgMissions).toHaveLength(2);
    expect(otherOrgMissions).toHaveLength(1);
    expect(orgMissions.every((mission) => mission.organizationId === ORG)).toBe(true);
  });
});
