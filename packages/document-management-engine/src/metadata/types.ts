/** @module metadata/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DocumentId } from '../document/types.js';
import type { DocumentMetadataId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';

export type { DocumentMetadataId };

/** The single metadata record for one document — tags, categories, owners, retention, and expiry. */
export interface DocumentMetadata extends TenantAuditableEntity<DocumentMetadataId> {
  readonly documentId: DocumentId;
  readonly tags: readonly string[];
  readonly categories: readonly string[];
  /** Opaque foreign keys — typically HR employee ids. May list more than one co-owner beyond the document's primary `ownerId`. */
  readonly owners: readonly string[];
  readonly retentionDays?: number;
  readonly expiryDate?: ISODate;
  readonly expired: boolean;
}
