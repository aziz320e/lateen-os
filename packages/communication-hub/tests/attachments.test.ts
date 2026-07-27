import { describe, expect, it } from 'vitest';
import { createAttachmentRepository } from '../src/attachment/repository.impl.js';
import { createAttachmentService } from '../src/attachment/service.impl.js';
import { AttachmentNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const repository = createAttachmentRepository();
  const service = createAttachmentService(repository);
  return { repository, service };
}

describe('createAttachmentService', () => {
  it('createAttachment() records metadata only', async () => {
    const { service } = setup();
    const attachment = await service.createAttachment(ORG, {
      attachmentType: 'document',
      fileName: 'invoice.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 20480,
      url: 'https://files.example.com/invoice.pdf',
    });
    expect(attachment.fileName).toBe('invoice.pdf');
    expect(attachment.mimeType).toBe('application/pdf');
  });

  it('supports all 5 deterministic attachment types', async () => {
    const { service } = setup();
    const types = ['document', 'image', 'audio', 'video', 'generic'] as const;
    for (const attachmentType of types) {
      const attachment = await service.createAttachment(ORG, { attachmentType, fileName: `file.${attachmentType}` });
      expect(attachment.attachmentType).toBe(attachmentType);
    }
  });

  it('createAttachment() can link to a message', async () => {
    const { service } = setup();
    const attachment = await service.createAttachment(ORG, { attachmentType: 'image', fileName: 'photo.png', messageId: 'message-1' });
    expect(attachment.messageId).toBe('message-1');
  });

  it('getAttachment() returns null for an unknown attachment', async () => {
    const { service } = setup();
    expect(await service.getAttachment(ORG, 'missing')).toBeNull();
  });

  it('listByMessage() returns every attachment linked to a message', async () => {
    const { service } = setup();
    await service.createAttachment(ORG, { attachmentType: 'image', fileName: 'a.png', messageId: 'message-1' });
    await service.createAttachment(ORG, { attachmentType: 'document', fileName: 'b.pdf', messageId: 'message-1' });
    await service.createAttachment(ORG, { attachmentType: 'video', fileName: 'c.mp4', messageId: 'message-2' });

    const attachments = await service.listByMessage(ORG, 'message-1');
    expect(attachments).toHaveLength(2);
  });

  it('deleteAttachment() removes the metadata record', async () => {
    const { service } = setup();
    const attachment = await service.createAttachment(ORG, { attachmentType: 'generic', fileName: 'file.bin' });
    await service.deleteAttachment(ORG, attachment.id);
    expect(await service.getAttachment(ORG, attachment.id)).toBeNull();
  });

  it('deleteAttachment() throws AttachmentNotFoundError for an unknown attachment', async () => {
    const { service } = setup();
    await expect(service.deleteAttachment(ORG, 'missing')).rejects.toBeInstanceOf(AttachmentNotFoundError);
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const attachment = await service.createAttachment(ORG, { attachmentType: 'generic', fileName: 'file.bin' });
    expect(await repository.findById('org-2', attachment.id)).toBeNull();
  });
});
