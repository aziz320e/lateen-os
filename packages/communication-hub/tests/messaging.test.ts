import { describe, expect, it, vi } from 'vitest';
import { createMessageRepository } from '../src/message/repository.impl.js';
import { canTransitionMessage, createMessageLifecycle } from '../src/message/lifecycle.impl.js';
import { createChannelRegistry } from '../src/channel/index.js';
import { createCommunicationEventBus } from '../src/events/communication-event-bus.js';
import { InvalidMessageTransitionError, MessageNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const CONVERSATION = 'conversation-1';

function setup(eventBus = createCommunicationEventBus(), channels = createChannelRegistry()) {
  const repository = createMessageRepository();
  const lifecycle = createMessageLifecycle(repository, channels, eventBus);
  return { repository, lifecycle, eventBus, channels };
}

describe('canTransitionMessage', () => {
  it('allows the full happy-path lifecycle', () => {
    expect(canTransitionMessage('draft', 'queued')).toBe(true);
    expect(canTransitionMessage('draft', 'sent')).toBe(true);
    expect(canTransitionMessage('queued', 'sent')).toBe(true);
    expect(canTransitionMessage('sent', 'delivered')).toBe(true);
    expect(canTransitionMessage('delivered', 'read')).toBe(true);
  });

  it('allows failing from draft, queued, or sent', () => {
    expect(canTransitionMessage('draft', 'failed')).toBe(true);
    expect(canTransitionMessage('queued', 'failed')).toBe(true);
    expect(canTransitionMessage('sent', 'failed')).toBe(true);
  });

  it('allows archiving from every non-archived status', () => {
    for (const status of ['draft', 'queued', 'sent', 'delivered', 'read', 'failed'] as const) {
      expect(canTransitionMessage(status, 'archived')).toBe(true);
    }
  });

  it('forbids leaving archived and skipping straight to read from draft', () => {
    expect(canTransitionMessage('archived', 'draft')).toBe(false);
    expect(canTransitionMessage('draft', 'read')).toBe(false);
  });
});

describe('createMessageLifecycle', () => {
  it('create() creates a draft message', async () => {
    const { lifecycle } = setup();
    const message = await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'text', body: 'Hello' });
    expect(message.status).toBe('draft');
    expect(message.attachmentIds).toEqual([]);
  });

  it('supports all 8 deterministic message types', async () => {
    const { lifecycle } = setup();
    const types = ['text', 'email', 'sms', 'whatsapp', 'system', 'workflow', 'ai', 'notification'] as const;
    for (const messageType of types) {
      const message = await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType });
      expect(message.messageType).toBe(messageType);
    }
  });

  it('queue() moves draft -> queued', async () => {
    const { lifecycle } = setup();
    const message = await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'text' });
    const queued = await lifecycle.queue(ORG, message.id);
    expect(queued.status).toBe('queued');
  });

  it('send() delivers through the default channel for the message type and transitions to sent', async () => {
    const { lifecycle } = setup();
    const message = await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'email', recipient: 'jordan@example.com', body: 'Hi' });
    const sent = await lifecycle.send(ORG, message.id);
    expect(sent.status).toBe('sent');
    expect(sent.providerMessageId).toBeDefined();
    expect(sent.sentAt).toBeDefined();
  });

  it('send() uses the internal_chat channel by default for non-channel message types', async () => {
    const { lifecycle, channels } = setup();
    const message = await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'system' });
    await lifecycle.send(ORG, message.id);
    expect(channels.get('internal_chat').listOutbox()).toHaveLength(1);
  });

  it('send() honors an explicit channel override', async () => {
    const { lifecycle, channels } = setup();
    const message = await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'text' });
    await lifecycle.send(ORG, message.id, 'webhook');
    expect(channels.get('webhook').listOutbox()).toHaveLength(1);
  });

  it('send() transitions to failed when the channel reports failure', async () => {
    const channels = createChannelRegistry({
      email: async () => ({ channelType: 'email', providerMessageId: 'x', status: 'failed', errorMessage: 'Bounced' }),
    });
    const { lifecycle } = setup(createCommunicationEventBus(), channels);
    const message = await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'email' });
    const failed = await lifecycle.send(ORG, message.id);
    expect(failed.status).toBe('failed');
    expect(failed.failedReason).toBe('Bounced');
  });

  it('deliver() and markRead() progress a sent message', async () => {
    const { lifecycle } = setup();
    const message = await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'text' });
    await lifecycle.send(ORG, message.id);
    const delivered = await lifecycle.deliver(ORG, message.id);
    expect(delivered.status).toBe('delivered');
    expect(delivered.deliveredAt).toBeDefined();
    const read = await lifecycle.markRead(ORG, message.id);
    expect(read.status).toBe('read');
    expect(read.readAt).toBeDefined();
  });

  it('fail() records a reason', async () => {
    const { lifecycle } = setup();
    const message = await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'text' });
    await lifecycle.queue(ORG, message.id);
    const failed = await lifecycle.fail(ORG, message.id, 'Manual failure');
    expect(failed.status).toBe('failed');
    expect(failed.failedReason).toBe('Manual failure');
  });

  it('archive() is terminal', async () => {
    const { lifecycle } = setup();
    const message = await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'text' });
    const archived = await lifecycle.archive(ORG, message.id);
    expect(archived.status).toBe('archived');
    await expect(lifecycle.archive(ORG, message.id)).rejects.toBeInstanceOf(InvalidMessageTransitionError);
  });

  it('throws MessageNotFoundError for an unknown message', async () => {
    const { lifecycle } = setup();
    await expect(lifecycle.queue(ORG, 'missing')).rejects.toBeInstanceOf(MessageNotFoundError);
  });

  it('get() returns null for an unknown message', async () => {
    const { lifecycle } = setup();
    expect(await lifecycle.get(ORG, 'missing')).toBeNull();
  });

  it('listByConversation() returns every message for a conversation', async () => {
    const { lifecycle } = setup();
    await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'text' });
    await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'email' });
    await lifecycle.create(ORG, { conversationId: 'conversation-2', messageType: 'sms' });

    const messages = await lifecycle.listByConversation(ORG, CONVERSATION);
    expect(messages).toHaveLength(2);
  });

  it('publishes message.created, message.sent, message.delivered, and message.read', async () => {
    const eventBus = createCommunicationEventBus();
    const created = vi.fn();
    const sent = vi.fn();
    const delivered = vi.fn();
    const read = vi.fn();
    eventBus.subscribe('message.created', created);
    eventBus.subscribe('message.sent', sent);
    eventBus.subscribe('message.delivered', delivered);
    eventBus.subscribe('message.read', read);

    const { lifecycle } = setup(eventBus);
    const message = await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'text' });
    await lifecycle.send(ORG, message.id);
    await lifecycle.deliver(ORG, message.id);
    await lifecycle.markRead(ORG, message.id);
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(sent).toHaveBeenCalledTimes(1);
    expect(delivered).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, lifecycle } = setup();
    const message = await lifecycle.create(ORG, { conversationId: CONVERSATION, messageType: 'text' });
    expect(await repository.findById('org-2', message.id)).toBeNull();
  });
});
