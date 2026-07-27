/** @module attachment/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AttachmentId, MessageId } from '../shared/identifiers.js';

export type { AttachmentId };

/** Deterministic attachment kind. Metadata only — no real file storage. */
export type AttachmentType = 'document' | 'image' | 'audio' | 'video' | 'generic';

/** Metadata describing a file attached to a message — never the file's actual bytes. */
export interface Attachment extends TenantAuditableEntity<AttachmentId> {
  readonly messageId?: MessageId;
  readonly attachmentType: AttachmentType;
  readonly fileName: string;
  readonly mimeType?: string;
  readonly sizeBytes?: number;
  /** A reference pointer (e.g. an external storage URL) — this package never stores the file itself. */
  readonly url?: string;
}

export type { OrganizationId } from '../shared/identifiers.js';
