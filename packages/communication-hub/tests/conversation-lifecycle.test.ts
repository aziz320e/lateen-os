import { describe, expect, it, vi } from 'vitest';
import { createConversationRepository } from '../src/conversation/repository.impl.js';
import { canTransitionConversation, createConversationLifecycle } from '../src/conversation/lifecycle.impl.js';
import { createCommunicationEventBus } from '../src/events/communication-event-bus.js';
import { ConversationNotFoundError, InvalidConversationTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createCommunicationEventBus()) {
  const repository = createConversationRepository();
  const lifecycle = createConversationLifecycle(repository, eventBus);
  return { repository, lifecycle, eventBus };
}

describe('canTransitionConversation', () => {
  it('allows open -> archived and open -> closed', () => {
    expect(canTransitionConversation('open', 'archived')).toBe(true);
    expect(canTransitionConversation('open', 'closed')).toBe(true);
  });

  it('allows reopening from archived or closed', () => {
    expect(canTransitionConversation('archived', 'open')).toBe(true);
    expect(canTransitionConversation('closed', 'open')).toBe(true);
  });

  it('forbids archived <-> closed directly', () => {
    expect(canTransitionConversation('archived', 'closed')).toBe(false);
    expect(canTransitionConversation('closed', 'archived')).toBe(false);
  });
});

describe('createConversationLifecycle', () => {
  it('create() creates an open conversation', async () => {
    const { lifecycle } = setup();
    const conversation = await lifecycle.create(ORG, { conversationType: 'support' });
    expect(conversation.status).toBe('open');
    expect(conversation.previousAssigneeIds).toEqual([]);
  });

  it('supports all 7 deterministic conversation types', async () => {
    const { lifecycle } = setup();
    const types = ['customer', 'internal', 'sales', 'marketing', 'support', 'workflow', 'ai'] as const;
    for (const conversationType of types) {
      const conversation = await lifecycle.create(ORG, { conversationType });
      expect(conversation.conversationType).toBe(conversationType);
    }
  });

  it('archive() sets archivedAt and reopen() clears it', async () => {
    const { lifecycle } = setup();
    const conversation = await lifecycle.create(ORG, { conversationType: 'support' });
    const archived = await lifecycle.archive(ORG, conversation.id);
    expect(archived.status).toBe('archived');
    expect(archived.archivedAt).toBeDefined();

    const reopened = await lifecycle.reopen(ORG, conversation.id);
    expect(reopened.status).toBe('open');
    expect(reopened.archivedAt).toBeUndefined();
  });

  it('close() sets closedAt and reopen() clears it', async () => {
    const { lifecycle } = setup();
    const conversation = await lifecycle.create(ORG, { conversationType: 'support' });
    const closed = await lifecycle.close(ORG, conversation.id);
    expect(closed.status).toBe('closed');
    expect(closed.closedAt).toBeDefined();

    const reopened = await lifecycle.reopen(ORG, conversation.id);
    expect(reopened.status).toBe('open');
    expect(reopened.closedAt).toBeUndefined();
  });

  it('assign() sets the first owner of an unassigned conversation', async () => {
    const { lifecycle } = setup();
    const conversation = await lifecycle.create(ORG, { conversationType: 'support' });
    const assigned = await lifecycle.assign(ORG, conversation.id, 'employee-1');
    expect(assigned.assignedToId).toBe('employee-1');
  });

  it('assign() rejects a conversation that is already assigned', async () => {
    const { lifecycle } = setup();
    const conversation = await lifecycle.create(ORG, { conversationType: 'support' });
    await lifecycle.assign(ORG, conversation.id, 'employee-1');
    await expect(lifecycle.assign(ORG, conversation.id, 'employee-2')).rejects.toBeInstanceOf(InvalidConversationTransitionError);
  });

  it('assign() rejects a closed conversation', async () => {
    const { lifecycle } = setup();
    const conversation = await lifecycle.create(ORG, { conversationType: 'support' });
    await lifecycle.close(ORG, conversation.id);
    await expect(lifecycle.assign(ORG, conversation.id, 'employee-1')).rejects.toBeInstanceOf(InvalidConversationTransitionError);
  });

  it('transfer() reassigns and records the prior owner', async () => {
    const { lifecycle } = setup();
    const conversation = await lifecycle.create(ORG, { conversationType: 'support' });
    await lifecycle.assign(ORG, conversation.id, 'employee-1');
    const transferred = await lifecycle.transfer(ORG, conversation.id, 'employee-2');
    expect(transferred.assignedToId).toBe('employee-2');
    expect(transferred.previousAssigneeIds).toEqual(['employee-1']);
  });

  it('transfer() accumulates history across multiple transfers', async () => {
    const { lifecycle } = setup();
    const conversation = await lifecycle.create(ORG, { conversationType: 'support' });
    await lifecycle.assign(ORG, conversation.id, 'employee-1');
    await lifecycle.transfer(ORG, conversation.id, 'employee-2');
    const transferred = await lifecycle.transfer(ORG, conversation.id, 'employee-3');
    expect(transferred.previousAssigneeIds).toEqual(['employee-1', 'employee-2']);
  });

  it('transfer() rejects an unassigned conversation', async () => {
    const { lifecycle } = setup();
    const conversation = await lifecycle.create(ORG, { conversationType: 'support' });
    await expect(lifecycle.transfer(ORG, conversation.id, 'employee-1')).rejects.toBeInstanceOf(InvalidConversationTransitionError);
  });

  it('throws ConversationNotFoundError for an unknown conversation', async () => {
    const { lifecycle } = setup();
    await expect(lifecycle.close(ORG, 'missing')).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it('get() returns null for an unknown conversation', async () => {
    const { lifecycle } = setup();
    expect(await lifecycle.get(ORG, 'missing')).toBeNull();
  });

  it('close() rejects an already-closed conversation', async () => {
    const { lifecycle } = setup();
    const conversation = await lifecycle.create(ORG, { conversationType: 'support' });
    await lifecycle.close(ORG, conversation.id);
    await expect(lifecycle.close(ORG, conversation.id)).rejects.toBeInstanceOf(InvalidConversationTransitionError);
  });

  it('publishes conversation.created and conversation.closed', async () => {
    const eventBus = createCommunicationEventBus();
    const created = vi.fn();
    const closed = vi.fn();
    eventBus.subscribe('conversation.created', created);
    eventBus.subscribe('conversation.closed', closed);

    const { lifecycle } = setup(eventBus);
    const conversation = await lifecycle.create(ORG, { conversationType: 'support' });
    await lifecycle.close(ORG, conversation.id);
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, lifecycle } = setup();
    const conversation = await lifecycle.create(ORG, { conversationType: 'support' });
    expect(await repository.findById('org-2', conversation.id)).toBeNull();
  });
});
