import { describe, expect, it } from 'vitest';
import { createMultiAgentRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('Integration: mission -> team -> coordination -> completion', () => {
  it('runs a full mission end to end without a Workflow Engine collaborator (direct step progression)', async () => {
    const runtime = createMultiAgentRuntime();

    const mission = await runtime.missions.create({
      organizationId: ORG,
      code: 'launch-campaign',
      title: 'Launch marketing campaign',
      description: 'Coordinate sales and marketing for a product launch.',
      priority: 'high',
      leadWorkerRole: 'ceo_ai',
    });

    const team = await runtime.team.assemble({
      organizationId: ORG,
      missionId: mission.id,
      name: 'Launch team',
      leaderWorkerId: 'ceo-worker',
      leaderRole: 'ceo_ai',
      requiredRoles: ['marketing_ai', 'sales_ai'],
    });

    await runtime.team.addMember(ORG, team.id, 'marketing-worker', {
      role: 'marketing_ai',
      responsibilities: ['campaign creative'],
      decisionAuthority: 'propose',
    });
    await runtime.team.addMember(ORG, team.id, 'sales-worker', {
      role: 'sales_ai',
      responsibilities: ['pipeline readiness'],
      decisionAuthority: 'recommend',
    });

    const planId = await runtime.orchestrator.startMission(ORG, mission.id);
    expect(planId).toBeTruthy();

    const active = await runtime.missions.get(ORG, mission.id);
    expect(active?.status).toBe('active');

    const { plan, steps } = await runtime.queries.findCoordinationPlan({ organizationId: ORG, missionId: mission.id });
    expect(plan?.id).toBe(planId);
    expect(steps).toHaveLength(2);
    expect(steps[0]?.status).toBe('ready'); // first step ready immediately
    expect(steps[1]?.status).toBe('pending'); // second step waits on the first

    // Step 1: ready -> running -> completed.
    expect(await runtime.orchestrator.advanceStep(ORG, steps[0]!.id)).toBe('running');
    expect(await runtime.orchestrator.advanceStep(ORG, steps[0]!.id)).toBe('completed');

    // Step 2 was unblocked by step 1 completing: pending -> ready -> running -> completed.
    expect(await runtime.orchestrator.advanceStep(ORG, steps[1]!.id)).toBe('ready');
    expect(await runtime.orchestrator.advanceStep(ORG, steps[1]!.id)).toBe('running');
    expect(await runtime.orchestrator.advanceStep(ORG, steps[1]!.id)).toBe('completed');

    const executionId = await runtime.orchestrator.completeMission(ORG, mission.id);
    expect(executionId).toBeTruthy();

    const completed = await runtime.missions.get(ORG, mission.id);
    expect(completed?.status).toBe('completed');
  });

  it('assignWorker reassigns a coordination step', async () => {
    const runtime = createMultiAgentRuntime();
    const mission = await runtime.missions.create({
      organizationId: ORG,
      code: 'reassign-demo',
      title: 'Reassign demo',
      description: 'Demonstrates reassignment.',
      priority: 'medium',
      leadWorkerRole: 'ceo_ai',
    });
    const team = await runtime.team.assemble({
      organizationId: ORG,
      missionId: mission.id,
      name: 'Demo team',
      leaderWorkerId: 'ceo-worker',
      leaderRole: 'ceo_ai',
      requiredRoles: ['finance_ai'],
    });
    await runtime.team.addMember(ORG, team.id, 'finance-worker-1', {
      role: 'finance_ai',
      responsibilities: [],
      decisionAuthority: 'recommend',
    });

    await runtime.orchestrator.startMission(ORG, mission.id);
    const { steps } = await runtime.queries.findCoordinationPlan({ organizationId: ORG, missionId: mission.id });
    const stepId = steps[0]!.id;

    await runtime.orchestrator.assignWorker(ORG, mission.id, 'finance-worker-2', stepId);
    const { steps: updated } = await runtime.queries.findCoordinationPlan({ organizationId: ORG, missionId: mission.id });
    expect(updated[0]?.assignedWorkerId).toBe('finance-worker-2');
  });

  it('completeMission fails the mission when a coordination step never completed', async () => {
    const runtime = createMultiAgentRuntime();
    const mission = await runtime.missions.create({
      organizationId: ORG,
      code: 'incomplete-demo',
      title: 'Incomplete demo',
      description: 'Never finishes its steps.',
      priority: 'low',
      leadWorkerRole: 'ceo_ai',
    });
    const team = await runtime.team.assemble({
      organizationId: ORG,
      missionId: mission.id,
      name: 'Incomplete team',
      leaderWorkerId: 'ceo-worker',
      leaderRole: 'ceo_ai',
      requiredRoles: ['hr_ai'],
    });
    await runtime.team.addMember(ORG, team.id, 'hr-worker', { role: 'hr_ai', responsibilities: [], decisionAuthority: 'none' });

    await runtime.orchestrator.startMission(ORG, mission.id);
    await runtime.orchestrator.completeMission(ORG, mission.id);

    const failed = await runtime.missions.get(ORG, mission.id);
    expect(failed?.status).toBe('failed');
  });
});
