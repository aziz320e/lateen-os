/** @module knowledge/types */
import type { MemoryCategory, ImportanceLevel, RetentionPolicy, Visibility } from '../classification/types.js';
import type { ConfidenceScore, Evidence } from '../confidence/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  EmployeeId,
  KnowledgeEntryId,
  KnowledgeEntryVersionId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { MemorySourceLabel, MemoryTag } from '../shared/primitives.js';

export type { KnowledgeEntryId, KnowledgeEntryVersionId };

/** Canonical knowledge type taxonomy for KnowledgeEntry. */
export type KnowledgeType =
  | 'best_practice'
  | 'lesson_learned'
  | 'policy'
  | 'procedure'
  | 'sop'
  | 'decision'
  | 'observation'
  | 'research'
  | 'insight'
  | 'finding'
  | 'template'
  | 'playbook'
  | 'faq'
  | 'documentation';

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
  /** Current immutable revision number — incremented on every content-changing update. */
  readonly currentVersion: number;
  /** Owning employee, required for 'private'/'restricted' visibility. */
  readonly ownerId?: EmployeeId;
  readonly retentionPolicy?: RetentionPolicy;
  readonly expiresAt?: string;
  readonly reviewDueAt?: string;
  /** Hierarchical parent — see `knowledge/relationships.impl.ts`. */
  readonly parentKnowledgeEntryId?: KnowledgeEntryId;
  /** Undirected "see also" links. */
  readonly relatedKnowledgeEntryIds: readonly KnowledgeEntryId[];
  /** Directed "depends on / cites" edges forming the dependency graph. */
  readonly referenceIds: readonly KnowledgeEntryId[];
}

/** Immutable snapshot of a {@link KnowledgeEntry}'s content at a point in time. */
export interface KnowledgeEntryVersion {
  readonly id: KnowledgeEntryVersionId;
  readonly knowledgeEntryId: KnowledgeEntryId;
  readonly organizationId: OrganizationId;
  readonly revisionNumber: number;
  readonly title: string;
  readonly content: string;
  readonly authorId?: EmployeeId;
  readonly changeSummary?: string;
  readonly createdAt: string;
}

export type { OrganizationId };
