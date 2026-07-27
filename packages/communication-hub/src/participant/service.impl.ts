/**
 * Real Participants service — users, AI workers, external contacts, and
 * organizations joining and leaving conversations, with roles and
 * permissions.
 *
 * @module participant/service.impl
 */
import type { CommunicationEventBus } from '../events/communication-event-bus.js';
import { ParticipantNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ConversationId, OrganizationId, ParticipantId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { ParticipantRepository } from './repository.js';
import type { Participant, ParticipantPermission, ParticipantRole, ParticipantType } from './types.js';

export interface JoinConversationInput {
  readonly conversationId: ConversationId;
  readonly participantType: ParticipantType;
  readonly displayName: string;
  readonly referenceId?: string;
  readonly role?: ParticipantRole;
  readonly permissions?: readonly ParticipantPermission[];
  readonly joinedAt?: ISODateTime;
}

export interface ParticipantService {
  join(organizationId: OrganizationId, input: JoinConversationInput): Promise<Participant>;
  leave(organizationId: OrganizationId, participantId: ParticipantId): Promise<Participant>;
  updateRole(organizationId: OrganizationId, participantId: ParticipantId, role: ParticipantRole): Promise<Participant>;
  updatePermissions(organizationId: OrganizationId, participantId: ParticipantId, permissions: readonly ParticipantPermission[]): Promise<Participant>;
  get(organizationId: OrganizationId, participantId: ParticipantId): Promise<Participant | null>;
  listByConversation(organizationId: OrganizationId, conversationId: ConversationId): Promise<readonly Participant[]>;
}

/** Creates a real {@link ParticipantService} backed by a {@link ParticipantRepository}. */
export function createParticipantService(
  repository: ParticipantRepository,
  eventBus?: CommunicationEventBus,
  now: () => string = nowIso,
): ParticipantService {
  async function requireParticipant(organizationId: OrganizationId, participantId: ParticipantId): Promise<Participant> {
    const participant = await repository.findById(organizationId, participantId);
    if (!participant) throw new ParticipantNotFoundError(participantId);
    return participant;
  }

  return {
    async join(organizationId, input) {
      const timestamp = now();
      const participant: Participant = {
        id: generateId('participant'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        conversationId: input.conversationId,
        participantType: input.participantType,
        referenceId: input.referenceId,
        displayName: input.displayName,
        role: input.role ?? 'member',
        permissions: input.permissions ?? ['read', 'write'],
        status: 'active',
        joinedAt: input.joinedAt ?? timestamp,
      };
      await repository.save(participant);
      eventBus?.publish('participant.joined', { participantId: participant.id, organizationId, conversationId: participant.conversationId });
      return participant;
    },

    async leave(organizationId, participantId) {
      const participant = await requireParticipant(organizationId, participantId);
      const updated: Participant = { ...participant, status: 'left', leftAt: now(), updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('participant.left', { participantId, organizationId, conversationId: participant.conversationId });
      return updated;
    },

    async updateRole(organizationId, participantId, role) {
      const participant = await requireParticipant(organizationId, participantId);
      const updated: Participant = { ...participant, role, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async updatePermissions(organizationId, participantId, permissions) {
      const participant = await requireParticipant(organizationId, participantId);
      const updated: Participant = { ...participant, permissions, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, participantId) {
      return repository.findById(organizationId, participantId);
    },

    async listByConversation(organizationId, conversationId) {
      return repository.findByConversation(organizationId, conversationId);
    },
  };
}
