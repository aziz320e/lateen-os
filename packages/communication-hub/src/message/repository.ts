/** @module message/repository */
import type { Repository } from '../shared/repository.js';
import type { ConversationId, MessageId, OrganizationId } from '../shared/identifiers.js';
import type { Message, MessageStatus, MessageType } from './types.js';

export interface MessageRepository extends Repository<Message, MessageId> {
  findAll(organizationId: OrganizationId): Promise<readonly Message[]>;
  findByConversation(organizationId: OrganizationId, conversationId: ConversationId): Promise<readonly Message[]>;
  findByStatus(organizationId: OrganizationId, status: MessageStatus): Promise<readonly Message[]>;
  findByType(organizationId: OrganizationId, messageType: MessageType): Promise<readonly Message[]>;
}
