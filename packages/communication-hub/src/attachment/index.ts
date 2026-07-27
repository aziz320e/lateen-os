/**
 * Attachments — metadata for documents, images, audio, video, and
 * generic files. No real storage.
 * @module attachment
 */
export * from './types.js';
export * from './repository.js';
export { createAttachmentRepository } from './repository.impl.js';
export { createAttachmentService, type AttachmentService, type CreateAttachmentInput } from './service.impl.js';
