import { describe, expect, it } from 'vitest';
import { createMultiAgentRuntime } from '../src/runtime.js';

const ORG = 'org-1';
const MISSION = 'mission-1';

describe('Integration: Agent Communication Bus + Message Routing', () => {
  it('routes a sent message to every other participant', async () => {
    const runtime = createMultiAgentRuntime();
    const conversation = await runtime.communicationBus.createConversation(ORG, MISSION, 'Launch planning', [
      'ceo-worker',
      'marketing-worker',
      'sales-worker',
    ]);

    const { recipientWorkerIds } = await runtime.communicationBus.send({
      organizationId: ORG,
      conversationId: conversation.id,
      authorWorkerId: 'ceo-worker',
      type: 'statement',
      content: 'Let us align on the launch date.',
    });

    expect(recipientWorkerIds.sort()).toEqual(['marketing-worker', 'sales-worker']);
  });

  it('addParticipant expands who future messages route to', async () => {
    const runtime = createMultiAgentRuntime();
    const conversation = await runtime.communicationBus.createConversation(ORG, MISSION, 'Launch planning', ['ceo-worker']);
    await runtime.communicationBus.addParticipant(ORG, conversation.id, 'finance-worker');

    const { recipientWorkerIds } = await runtime.communicationBus.send({
      organizationId: ORG,
      conversationId: conversation.id,
      authorWorkerId: 'ceo-worker',
      type: 'question',
      content: 'What is our budget ceiling?',
    });

    expect(recipientWorkerIds).toEqual(['finance-worker']);
  });

  it('history returns messages in the order they were sent', async () => {
    const runtime = createMultiAgentRuntime();
    const conversation = await runtime.communicationBus.createConversation(ORG, MISSION, 'Thread', ['a', 'b']);
    await runtime.communicationBus.send({ organizationId: ORG, conversationId: conversation.id, authorWorkerId: 'a', type: 'statement', content: 'first' });
    await runtime.communicationBus.send({ organizationId: ORG, conversationId: conversation.id, authorWorkerId: 'b', type: 'response', content: 'second' });

    const history = await runtime.communicationBus.history(ORG, conversation.id);
    expect(history.map((message) => message.content)).toEqual(['first', 'second']);
  });

  it('openDiscussion tracks the discussion under the conversation', async () => {
    const runtime = createMultiAgentRuntime();
    const conversation = await runtime.communicationBus.createConversation(ORG, MISSION, 'Thread', ['a', 'b']);
    const discussion = await runtime.communicationBus.openDiscussion(ORG, conversation.id, 'Pricing strategy', ['a', 'b']);
    expect(discussion.status).toBe('open');
    expect(discussion.conversationId).toBe(conversation.id);
  });

  it('propose records a decision proposal linked to the conversation and discussion', async () => {
    const runtime = createMultiAgentRuntime();
    const conversation = await runtime.communicationBus.createConversation(ORG, MISSION, 'Thread', ['a', 'b']);
    const discussion = await runtime.communicationBus.openDiscussion(ORG, conversation.id, 'Pricing strategy', ['a', 'b']);

    const proposal = await runtime.communicationBus.propose({
      organizationId: ORG,
      conversationId: conversation.id,
      discussionId: discussion.id,
      proposerWorkerId: 'a',
      title: 'Discount bundle',
      rationale: 'Increases conversion',
      proposedAction: 'apply_10_percent_discount',
    });

    expect(proposal.status).toBe('submitted');
    expect(proposal.discussionId).toBe(discussion.id);
  });
});
