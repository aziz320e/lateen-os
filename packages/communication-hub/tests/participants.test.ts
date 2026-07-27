import { describe, expect, it, vi } from 'vitest';
import { createParticipantRepository } from '../src/participant/repository.impl.js';
import { createParticipantService } from '../src/participant/service.impl.js';
import { createCommunicationEventBus } from '../src/events/communication-event-bus.js';
import { ParticipantNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const CONVERSATION = 'conversation-1';

function setup(eventBus = createCommunicationEventBus()) {
  const repository = createParticipantRepository();
  const service = createParticipantService(repository, eventBus);
  return { repository, service, eventBus };
}

describe('createParticipantService', () => {
  it('join() defaults to member role with read/write permissions', async () => {
    const { service } = setup();
    const participant = await service.join(ORG, { conversationId: CONVERSATION, participantType: 'user', displayName: 'Jordan Lee' });
    expect(participant.role).toBe('member');
    expect(participant.permissions).toEqual(['read', 'write']);
    expect(participant.status).toBe('active');
  });

  it('supports all 4 deterministic participant types', async () => {
    const { service } = setup();
    const types = ['user', 'ai_worker', 'external_contact', 'organization'] as const;
    for (const participantType of types) {
      const participant = await service.join(ORG, { conversationId: CONVERSATION, participantType, displayName: `A ${participantType}` });
      expect(participant.participantType).toBe(participantType);
    }
  });

  it('join() honors an explicit role, permissions, and referenceId', async () => {
    const { service } = setup();
    const participant = await service.join(ORG, {
      conversationId: CONVERSATION,
      participantType: 'user',
      displayName: 'Owner',
      role: 'owner',
      permissions: ['read', 'write', 'manage'],
      referenceId: 'employee-1',
    });
    expect(participant.role).toBe('owner');
    expect(participant.permissions).toEqual(['read', 'write', 'manage']);
    expect(participant.referenceId).toBe('employee-1');
  });

  it('leave() sets status left and stamps leftAt', async () => {
    const { service } = setup();
    const participant = await service.join(ORG, { conversationId: CONVERSATION, participantType: 'user', displayName: 'Jordan Lee' });
    const left = await service.leave(ORG, participant.id);
    expect(left.status).toBe('left');
    expect(left.leftAt).toBeDefined();
  });

  it('updateRole() changes the role', async () => {
    const { service } = setup();
    const participant = await service.join(ORG, { conversationId: CONVERSATION, participantType: 'user', displayName: 'Jordan Lee' });
    const updated = await service.updateRole(ORG, participant.id, 'observer');
    expect(updated.role).toBe('observer');
  });

  it('updatePermissions() changes the permission set', async () => {
    const { service } = setup();
    const participant = await service.join(ORG, { conversationId: CONVERSATION, participantType: 'user', displayName: 'Jordan Lee' });
    const updated = await service.updatePermissions(ORG, participant.id, ['read']);
    expect(updated.permissions).toEqual(['read']);
  });

  it('throws ParticipantNotFoundError for an unknown participant', async () => {
    const { service } = setup();
    await expect(service.leave(ORG, 'missing')).rejects.toBeInstanceOf(ParticipantNotFoundError);
  });

  it('get() returns null for an unknown participant', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });

  it('listByConversation() returns every participant for a conversation', async () => {
    const { service } = setup();
    await service.join(ORG, { conversationId: CONVERSATION, participantType: 'user', displayName: 'A' });
    await service.join(ORG, { conversationId: CONVERSATION, participantType: 'ai_worker', displayName: 'B' });
    await service.join(ORG, { conversationId: 'conversation-2', participantType: 'user', displayName: 'C' });

    const participants = await service.listByConversation(ORG, CONVERSATION);
    expect(participants).toHaveLength(2);
  });

  it('publishes participant.joined and participant.left', async () => {
    const eventBus = createCommunicationEventBus();
    const joined = vi.fn();
    const left = vi.fn();
    eventBus.subscribe('participant.joined', joined);
    eventBus.subscribe('participant.left', left);

    const { service } = setup(eventBus);
    const participant = await service.join(ORG, { conversationId: CONVERSATION, participantType: 'user', displayName: 'Jordan Lee' });
    await service.leave(ORG, participant.id);
    await Promise.resolve();

    expect(joined).toHaveBeenCalledTimes(1);
    expect(left).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const participant = await service.join(ORG, { conversationId: CONVERSATION, participantType: 'user', displayName: 'Jordan Lee' });
    expect(await repository.findById('org-2', participant.id)).toBeNull();
  });
});
