/** @module evidence/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ComplianceControlId, ComplianceFrameworkId, EvidenceAttachmentId, EvidenceRecordId } from '../shared/identifiers.js';

export type { EvidenceRecordId, EvidenceAttachmentId };

/** Where an evidence record originated. */
export type EvidenceSource = 'manual' | 'system' | 'integration' | 'audit';

/** Attachment metadata only — no real file storage, mirroring Communication Hub's Attachment pattern. */
export interface EvidenceAttachment {
  readonly id: EvidenceAttachmentId;
  readonly fileName: string;
  readonly mimeType?: string;
  readonly sizeBytes?: number;
  /** A pointer to externally-stored content — never the content itself. */
  readonly url?: string;
}

/** A single, immutable evidence record. */
export interface EvidenceRecord extends TenantAuditableEntity<EvidenceRecordId> {
  readonly controlId?: ComplianceControlId;
  readonly frameworkId?: ComplianceFrameworkId;
  readonly source: EvidenceSource;
  readonly description?: string;
  readonly attachments: readonly EvidenceAttachment[];
  readonly collectedAt: string;
}
