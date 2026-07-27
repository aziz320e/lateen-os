/** Real, in-memory {@link AttachmentRepository} implementation. @module attachment/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Attachment } from './types.js';
import type { AttachmentRepository } from './repository.js';

/** Creates a real, in-memory {@link AttachmentRepository}. */
export function createAttachmentRepository(seed?: readonly Attachment[]): AttachmentRepository {
  const repo = createInMemoryRepository<Attachment>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByMessage(organizationId, messageId) {
      return repo.list(organizationId).filter((attachment) => attachment.messageId === messageId);
    },
  };
}
