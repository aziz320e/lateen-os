/** @module memory/types */
import type {
  ImportanceLevel,
  MemoryCategory,
  RetentionPolicy,
  Visibility,
} from '../classification/types.js';
import type { ConfidenceScore, Evidence } from '../confidence/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { InstitutionalMemoryId, OrganizationId } from '../shared/identifiers.js';
import type { MemorySourceLabel, MemoryTag } from '../shared/primitives.js';

export type { InstitutionalMemoryId };

export type InstitutionalMemoryStatus = 'draft' | 'active' | 'archived' | 'superseded';

/**
 * Root aggregate — curated organizational memory artifact.
 * Not chat history. Not logs. Long-term institutional knowledge.
 */
export interface InstitutionalMemory extends TenantAuditableEntity<InstitutionalMemoryId> {
  readonly title: string;
  readonly summary: string;
  readonly source: MemorySourceLabel;
  readonly category: MemoryCategory;
  readonly importance: ImportanceLevel;
  readonly confidence: ConfidenceScore;
  readonly visibility: Visibility;
  readonly retentionPolicy?: RetentionPolicy;
  readonly tags: readonly MemoryTag[];
  readonly status: InstitutionalMemoryStatus;
  readonly evidence?: readonly Evidence[];
}

export type { OrganizationId };
