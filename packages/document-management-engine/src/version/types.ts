/** @module version/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DocumentId } from '../document/types.js';
import type { DocumentVersionId } from '../shared/identifiers.js';

export type { DocumentVersionId };

/** An immutable content snapshot of a document — there is no update or delete on this aggregate. */
export interface DocumentVersion extends TenantAuditableEntity<DocumentVersionId> {
  readonly documentId: DocumentId;
  readonly versionNumber: number;
  /** Opaque reference to the actual stored content (e.g. a content hash or storage key) — this package never stores file bytes. */
  readonly contentRef: string;
  readonly changeNotes?: string;
  /** Opaque foreign key — typically an HR employee id. */
  readonly createdBy?: string;
}
