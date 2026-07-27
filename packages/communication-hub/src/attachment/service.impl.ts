/**
 * Real Attachments service — metadata for documents, images, audio,
 * video, and generic files. No real storage; this package never holds
 * file bytes, only pointers and descriptive metadata.
 *
 * @module attachment/service.impl
 */
import { AttachmentNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AttachmentId, MessageId, OrganizationId } from '../shared/identifiers.js';
import type { Attachment, AttachmentType } from './types.js';
import type { AttachmentRepository } from './repository.js';

export interface CreateAttachmentInput {
  readonly messageId?: MessageId;
  readonly attachmentType: AttachmentType;
  readonly fileName: string;
  readonly mimeType?: string;
  readonly sizeBytes?: number;
  readonly url?: string;
}

export interface AttachmentService {
  createAttachment(organizationId: OrganizationId, input: CreateAttachmentInput): Promise<Attachment>;
  getAttachment(organizationId: OrganizationId, attachmentId: AttachmentId): Promise<Attachment | null>;
  listByMessage(organizationId: OrganizationId, messageId: MessageId): Promise<readonly Attachment[]>;
  deleteAttachment(organizationId: OrganizationId, attachmentId: AttachmentId): Promise<void>;
}

/** Creates a real {@link AttachmentService} backed by an {@link AttachmentRepository}. */
export function createAttachmentService(repository: AttachmentRepository, now: () => string = nowIso): AttachmentService {
  return {
    async createAttachment(organizationId, input) {
      const timestamp = now();
      const attachment: Attachment = {
        id: generateId('attachment'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        messageId: input.messageId,
        attachmentType: input.attachmentType,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        url: input.url,
      };
      await repository.save(attachment);
      return attachment;
    },

    async getAttachment(organizationId, attachmentId) {
      return repository.findById(organizationId, attachmentId);
    },

    async listByMessage(organizationId, messageId) {
      return repository.findByMessage(organizationId, messageId);
    },

    async deleteAttachment(organizationId, attachmentId) {
      const attachment = await repository.findById(organizationId, attachmentId);
      if (!attachment) throw new AttachmentNotFoundError(attachmentId);
      await repository.delete(organizationId, attachmentId);
    },
  };
}
