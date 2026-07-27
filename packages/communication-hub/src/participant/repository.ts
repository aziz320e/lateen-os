/** @module participant/repository */
import type { Repository } from '../shared/repository.js';
import type { ConversationId, OrganizationId, ParticipantId } from '../shared/identifiers.js';
import type { Participant, ParticipantStatus } from './types.js';

export interface ParticipantRepository extends Repository<Participant, ParticipantId> {
  findAll(organizationId: OrganizationId): Promise<readonly Participant[]>;
  findByConversation(organizationId: OrganizationId, conversationId: ConversationId): Promise<readonly Participant[]>;
  findByStatus(organizationId: OrganizationId, status: ParticipantStatus): Promise<readonly Participant[]>;
}
