import { describe, expect, it } from 'vitest';
import { createMultiAgentRuntime } from '../src/runtime.js';
import { createCollaborationEventBus } from '../src/events/index.js';

const ORG = 'org-1';
const MISSION = 'mission-1';

describe('Integration: Collaboration Event Bus', () => {
  it('publishes every declared event as the real services that trigger it run', async () => {
    const eventBus = createCollaborationEventBus();
    const seen: string[] = [];
    eventBus.subscribeAll((name) => {
      seen.push(name);
    });
    const runtime = createMultiAgentRuntime({ eventBus });

    // agent.registered, agent.availability_changed
    await runtime.registerAgent(ORG, { workerId: 'w1', role: 'sales_ai', capabilities: [], displayName: 'W1' });
    await runtime.agentRegistry.setAvailability(ORG, 'w1', 'busy');

    // mission.started, mission.completed
    const mission = await runtime.missions.create({
      organizationId: ORG,
      code: 'evt-demo',
      title: 'Event demo',
      description: 'demo',
      priority: 'low',
      leadWorkerRole: 'ceo_ai',
    });
    await runtime.missions.start(ORG, mission.id);
    await runtime.missions.complete(ORG, mission.id);

    // mission.escalated
    await runtime.orchestrator.escalate(ORG, mission.id, 'needs CEO review');

    // session.started, session.ended
    const session = await runtime.sessions.start(ORG, MISSION, 'w1');
    await runtime.sessions.end(ORG, session.id);

    // message.routed
    const conversation = await runtime.communicationBus.createConversation(ORG, MISSION, 'Thread', ['a', 'b']);
    await runtime.communicationBus.send({ organizationId: ORG, conversationId: conversation.id, authorWorkerId: 'a', type: 'statement', content: 'hi' });

    // delegation.requested, delegation.responded
    const delegation = await runtime.delegation.request({
      organizationId: ORG,
      missionId: MISSION,
      sourceWorkerId: 'a',
      targetWorkerId: 'b',
      objective: 'help',
      rationale: 'needed',
    });
    await runtime.delegation.respond(ORG, delegation.id, true, 'b');

    // consensus.reached
    await runtime.consensus.tally({
      organizationId: ORG,
      missionId: MISSION,
      strategy: 'majority',
      votes: [{ workerId: 'a', role: 'sales_ai', approve: true }],
    });

    // conflict.detected, conflict.resolved
    const discussion = await runtime.communicationBus.openDiscussion(ORG, conversation.id, 'Topic', ['a', 'b']);
    const proposalA = await runtime.communicationBus.propose({ organizationId: ORG, conversationId: conversation.id, discussionId: discussion.id, proposerWorkerId: 'a', title: 'A', rationale: 'r', proposedAction: 'x' });
    await runtime.communicationBus.propose({ organizationId: ORG, conversationId: conversation.id, discussionId: discussion.id, proposerWorkerId: 'b', title: 'B', rationale: 'r', proposedAction: 'y' });
    const conflict = await runtime.conflictDetector.detect(ORG, MISSION, conversation.id, discussion.id);
    await runtime.conflictResolver.resolveByVote(ORG, conflict!.id, [
      { workerId: 'a', role: 'ceo_ai', proposalId: proposalA.id },
    ]);

    // coordination_step.advanced (a fresh mission — the first is already 'completed')
    const stepMission = await runtime.missions.create({
      organizationId: ORG,
      code: 'evt-step-demo',
      title: 'Step event demo',
      description: 'demo',
      priority: 'low',
      leadWorkerRole: 'operations_ai',
    });
    const stepTeam = await runtime.team.assemble({
      organizationId: ORG,
      missionId: stepMission.id,
      name: 'Step team',
      leaderWorkerId: 'ops-worker',
      leaderRole: 'operations_ai',
      requiredRoles: ['operations_ai'],
    });
    await runtime.team.addMember(ORG, stepTeam.id, 'ops-worker', { role: 'operations_ai', responsibilities: [], decisionAuthority: 'approve' });
    await runtime.orchestrator.startMission(ORG, stepMission.id);
    const { steps } = await runtime.queries.findCoordinationPlan({ organizationId: ORG, missionId: stepMission.id });
    await runtime.orchestrator.advanceStep(ORG, steps[0]!.id);

    const uniqueSeen = new Set(seen);
    const expectedEvents = [
      'agent.registered',
      'agent.availability_changed',
      'mission.started',
      'mission.completed',
      'mission.escalated',
      'session.started',
      'session.ended',
      'message.routed',
      'delegation.requested',
      'delegation.responded',
      'consensus.reached',
      'conflict.detected',
      'conflict.resolved',
      'coordination_step.advanced',
    ];
    for (const eventName of expectedEvents) {
      expect(uniqueSeen.has(eventName), `expected "${eventName}" to have been published`).toBe(true);
    }
  });
});
