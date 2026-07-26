import { describe, expect, it } from 'vitest';
import { createMultiAgentRuntime } from '../src/runtime.js';

const ORG = 'org-1';
const MISSION = 'mission-1';

describe('Integration: Query Layer', () => {
  it('findAgents filters by role and availability', async () => {
    const runtime = createMultiAgentRuntime();
    await runtime.agentRegistry.register(ORG, { workerId: 'w1', role: 'sales_ai', capabilities: [], displayName: 'W1' });
    await runtime.agentRegistry.register(ORG, { workerId: 'w2', role: 'finance_ai', capabilities: [], displayName: 'W2' });
    await runtime.agentRegistry.setAvailability(ORG, 'w2', 'busy');

    const salesAgents = await runtime.queries.findAgents({ organizationId: ORG, role: 'sales_ai' });
    expect(salesAgents.total).toBe(1);

    const availableAgents = await runtime.queries.findAgents({ organizationId: ORG, availability: 'available' });
    expect(availableAgents.total).toBe(1);
    expect(availableAgents.agents[0]?.descriptor.workerId).toBe('w1');
  });

  it('findConflicts filters by mission and status', async () => {
    const runtime = createMultiAgentRuntime();
    const conversation = await runtime.communicationBus.createConversation(ORG, MISSION, 'Thread', ['a', 'b']);
    const discussion = await runtime.communicationBus.openDiscussion(ORG, conversation.id, 'Topic', ['a', 'b']);
    await runtime.communicationBus.propose({ organizationId: ORG, conversationId: conversation.id, discussionId: discussion.id, proposerWorkerId: 'a', title: 'A', rationale: 'r', proposedAction: 'x' });
    await runtime.communicationBus.propose({ organizationId: ORG, conversationId: conversation.id, discussionId: discussion.id, proposerWorkerId: 'b', title: 'B', rationale: 'r', proposedAction: 'y' });
    await runtime.conflictDetector.detect(ORG, MISSION, conversation.id, discussion.id);

    const detected = await runtime.queries.findConflicts({ organizationId: ORG, missionId: MISSION, status: 'detected' });
    expect(detected.total).toBe(1);

    const resolved = await runtime.queries.findConflicts({ organizationId: ORG, missionId: MISSION, status: 'resolved' });
    expect(resolved.total).toBe(0);
  });

  it('findWorkingMemory filters by key', async () => {
    const runtime = createMultiAgentRuntime();
    await runtime.workingMemory.set(ORG, MISSION, 'a', 1, 'w1');
    await runtime.workingMemory.set(ORG, MISSION, 'b', 2, 'w1');

    const all = await runtime.queries.findWorkingMemory({ organizationId: ORG, missionId: MISSION });
    expect(all.total).toBe(2);

    const scoped = await runtime.queries.findWorkingMemory({ organizationId: ORG, missionId: MISSION, key: 'a' });
    expect(scoped.total).toBe(1);
  });

  it('findActiveSessions only returns active sessions for the mission', async () => {
    const runtime = createMultiAgentRuntime();
    const session = await runtime.sessions.start(ORG, MISSION, 'w1');
    await runtime.sessions.start(ORG, MISSION, 'w2');
    await runtime.sessions.end(ORG, session.id);

    const active = await runtime.queries.findActiveSessions({ organizationId: ORG, missionId: MISSION });
    expect(active.total).toBe(1);
  });

  it('findMission supports lookup by code, by id, by status, and unscoped', async () => {
    const runtime = createMultiAgentRuntime();
    const mission = await runtime.missions.create({
      organizationId: ORG,
      code: 'q-demo',
      title: 'Query demo',
      description: 'demo',
      priority: 'low',
      leadWorkerRole: 'ceo_ai',
    });

    expect((await runtime.queries.findMission({ organizationId: ORG, code: 'q-demo' })).total).toBe(1);
    expect((await runtime.queries.findMission({ organizationId: ORG, missionId: mission.id })).total).toBe(1);
    expect((await runtime.queries.findMission({ organizationId: ORG, status: 'draft' })).total).toBe(1);
    expect((await runtime.queries.findMission({ organizationId: ORG })).total).toBe(1);
  });

  it('findTeams supports lookup by mission and by team id', async () => {
    const runtime = createMultiAgentRuntime();
    const mission = await runtime.missions.create({
      organizationId: ORG,
      code: 'team-demo',
      title: 'Team demo',
      description: 'demo',
      priority: 'low',
      leadWorkerRole: 'ceo_ai',
    });
    const team = await runtime.team.assemble({
      organizationId: ORG,
      missionId: mission.id,
      name: 'Demo team',
      leaderWorkerId: 'ceo-worker',
      leaderRole: 'ceo_ai',
      requiredRoles: [],
    });

    expect((await runtime.queries.findTeams({ organizationId: ORG, missionId: mission.id })).total).toBe(1);
    expect((await runtime.queries.findTeams({ organizationId: ORG, teamId: team.id })).total).toBe(1);
  });
});
