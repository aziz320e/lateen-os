/** @module attachment/repository */
import type { Repository } from '../shared/repository.js';
import type { AttachmentId, MessageId, OrganizationId } from '../shared/identifiers.js';
import type { Attachment } from './types.js';

export interface AttachmentRepository extends Repository<Attachment, AttachmentId> {
  findAll(organizationId: OrganizationId): Promise<readonly Attachment[]>;
  findByMessage(organizationId: OrganizationId, messageId: MessageId): Promise<readonly Attachment[]>;
}
