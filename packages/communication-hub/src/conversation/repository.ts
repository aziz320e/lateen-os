/** @module conversation/repository */
import type { Repository } from '../shared/repository.js';
import type { ConversationId, OrganizationId } from '../shared/identifiers.js';
import type { Conversation, ConversationStatus, ConversationType } from './types.js';

export interface ConversationRepository extends Repository<Conversation, ConversationId> {
  findAll(organizationId: OrganizationId): Promise<readonly Conversation[]>;
  findByStatus(organizationId: OrganizationId, status: ConversationStatus): Promise<readonly Conversation[]>;
  findByType(organizationId: OrganizationId, conversationType: ConversationType): Promise<readonly Conversation[]>;
}
