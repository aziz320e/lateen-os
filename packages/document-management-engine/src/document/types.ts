/** @module document/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DocumentId, FolderId } from '../shared/identifiers.js';

export type { DocumentId, FolderId };

export type DocumentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

export type DocumentType =
  | 'contract'
  | 'proposal'
  | 'invoice_reference'
  | 'sop'
  | 'policy'
  | 'specification'
  | 'report'
  | 'project_document'
  | 'customer_document'
  | 'hr_document';

/** The real, authoritative document aggregate. Content itself is never stored here — see `version` for immutable content snapshots. */
export interface Document extends TenantAuditableEntity<DocumentId> {
  readonly title: string;
  readonly documentType: DocumentType;
  readonly folderId?: FolderId;
  /** Opaque foreign key — typically an HR employee id. */
  readonly ownerId?: string;
  readonly status: DocumentStatus;
  /** Stamped on `archive()`; consumed by `restore()` to return to the correct prior status. */
  readonly statusBeforeArchive?: DocumentStatus;
  /** The `versionNumber` of the currently-current `DocumentVersion`, or `0` if no version has been created yet. */
  readonly currentVersionNumber: number;
  readonly currentVersion: number;
}
