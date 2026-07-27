import { describe, expect, it, vi } from 'vitest';
import { createCommunicationEventBus } from '../src/events/communication-event-bus.js';
import { COMMUNICATION_EVENT_NAMES } from '../src/events/communication-events.js';
import { createCommunicationRuntime } from '../src/runtime.js';

describe('COMMUNICATION_EVENT_NAMES', () => {
  it('declares exactly the 10 required event names', () => {
    expect(Object.values(COMMUNICATION_EVENT_NAMES).sort()).toEqual(
      [
        'conversation.created',
        'conversation.closed',
        'participant.joined',
        'participant.left',
        'message.created',
        'message.sent',
        'message.delivered',
        'message.read',
        'notification.created',
        'notification.sent',
      ].sort(),
    );
  });
});

describe('createCommunicationEventBus', () => {
  it('dispatches to subscribers of the exact event name only', () => {
    const eventBus = createCommunicationEventBus();
    const conversationCreated = vi.fn();
    const messageCreated = vi.fn();
    eventBus.subscribe('conversation.created', conversationCreated);
    eventBus.subscribe('message.created', messageCreated);

    eventBus.publish('conversation.created', { conversationId: 'conversation-1', organizationId: 'org-1', conversationType: 'support' });

    expect(conversationCreated).toHaveBeenCalledTimes(1);
    expect(messageCreated).not.toHaveBeenCalled();
  });
});

describe('end-to-end event flow through createCommunicationRuntime()', () => {
  it('every declared event is genuinely published by the real service that causes it', async () => {
    const runtime = createCommunicationRuntime();
    const seen: string[] = [];
    for (const eventName of Object.values(COMMUNICATION_EVENT_NAMES)) {
      runtime.events.subscribe(eventName, () => seen.push(eventName));
    }

    const ORG = 'org-1';
    const conversation = await runtime.conversations.create(ORG, { conversationType: 'support' });
    const participant = await runtime.participants.join(ORG, { conversationId: conversation.id, participantType: 'user', displayName: 'Jordan Lee' });

    const message = await runtime.messages.create(ORG, { conversationId: conversation.id, messageType: 'text', senderParticipantId: participant.id });
    await runtime.messages.send(ORG, message.id);
    await runtime.messages.deliver(ORG, message.id);
    await runtime.messages.markRead(ORG, message.id);

    await runtime.participants.leave(ORG, participant.id);

    const notification = await runtime.notifications.create(ORG, { notificationType: 'reminder', title: 'Follow up' });
    await runtime.notifications.send(ORG, notification.id);

    await runtime.conversations.close(ORG, conversation.id);
    await Promise.resolve();

    expect(new Set(seen)).toEqual(new Set(Object.values(COMMUNICATION_EVENT_NAMES)));
  });
});
