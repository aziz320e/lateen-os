import { describe, expect, it } from 'vitest';
import { createCommunicationRuntime } from '../src/runtime.js';
import { createCommunicationEventBus } from '../src/events/communication-event-bus.js';

describe('createCommunicationRuntime', () => {
  it('exposes only services, queries, and the event bus — never repositories', () => {
    const runtime = createCommunicationRuntime();
    expect(Object.keys(runtime).sort()).toEqual(
      [
        'conversations',
        'participants',
        'messages',
        'attachments',
        'templates',
        'notifications',
        'scheduling',
        'workflows',
        'relationships',
        'timeline',
        'queries',
        'events',
      ].sort(),
    );
  });

  it('accepts an injected eventBus and now()', async () => {
    const eventBus = createCommunicationEventBus();
    const fixedNow = '2024-01-01T00:00:00.000Z';
    const runtime = createCommunicationRuntime({ eventBus, now: () => fixedNow });

    expect(runtime.events).toBe(eventBus);
    const conversation = await runtime.conversations.create('org-1', { conversationType: 'support' });
    expect(conversation.createdAt).toBe(fixedNow);
  });

  it('is fully usable offline with zero injected collaborators', async () => {
    const runtime = createCommunicationRuntime();
    const conversation = await runtime.conversations.create('org-1', { conversationType: 'support' });
    const context = await runtime.relationships.getCustomerContext('org-1', 'customer-1');
    expect(context).toBeNull();
    const request = await runtime.workflows.generateRequest('org-1', { requestType: 'follow_up_reminder', conversationId: conversation.id });
    expect(request.workflowInstanceId).toBeUndefined();
  });

  it('channels still deterministically deliver messages with zero configuration', async () => {
    const runtime = createCommunicationRuntime();
    const conversation = await runtime.conversations.create('org-1', { conversationType: 'support' });
    const message = await runtime.messages.create('org-1', { conversationId: conversation.id, messageType: 'email', recipient: 'jordan@example.com' });
    const sent = await runtime.messages.send('org-1', message.id);
    expect(sent.status).toBe('sent');
    expect(sent.providerMessageId).toBeDefined();
  });

  it('runtime instances are independent — no shared module-level state', async () => {
    const runtimeA = createCommunicationRuntime();
    const runtimeB = createCommunicationRuntime();
    await runtimeA.conversations.create('org-1', { conversationType: 'support' });

    const result = await runtimeB.queries.findConversations({ organizationId: 'org-1' });
    expect(result.total).toBe(0);
  });

  it('scheduling composes the same message and notification services exposed on the runtime', async () => {
    const runtime = createCommunicationRuntime();
    const conversation = await runtime.conversations.create('org-1', { conversationType: 'support' });
    const item = await runtime.scheduling.scheduleMessage('org-1', {
      message: { conversationId: conversation.id, messageType: 'text' },
      scheduledFor: '2020-01-01T00:00:00.000Z',
    });
    await runtime.scheduling.dispatchDue('org-1', '2020-01-02T00:00:00.000Z');
    const message = await runtime.messages.get('org-1', item.referenceId);
    expect(message?.status).toBe('sent');
  });
});
