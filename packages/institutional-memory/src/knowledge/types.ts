/** @module knowledge/types */
import type { MemoryCategory, ImportanceLevel, Visibility } from '../classification/types.js';
import type { ConfidenceScore, Evidence } from '../confidence/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { KnowledgeEntryId, OrganizationId } from '../shared/identifiers.js';
import type { MemorySourceLabel, MemoryTag } from '../shared/primitives.js';

export type { KnowledgeEntryId };

/** Canonical knowledge type taxonomy for KnowledgeEntry. */
export type KnowledgeType =
  | 'best_practice'
  | 'lesson_learned'
  | 'policy'
  | 'procedure'
  | 'decision'
  | 'observation'
  | 'research'
  | 'insight'
  | 'finding'
  | 'template';

export type KnowledgeEntryStatus = 'draft' | 'published' | 'review' | 'archived';

/** Structured knowledge artifact in institutional memory. */
export interface KnowledgeEntry extends TenantAuditableEntity<KnowledgeEntryId> {
  readonly title: string;
  readonly content: string;
  readonly knowledgeType: KnowledgeType;
  readonly category: MemoryCategory;
  readonly importance: ImportanceLevel;
  readonly confidence: ConfidenceScore;
  readonly visibility: Visibility;
  readonly source: MemorySourceLabel;
  readonly tags: readonly MemoryTag[];
  readonly status: KnowledgeEntryStatus;
  readonly evidence?: readonly Evidence[];
}

export type { OrganizationId };
