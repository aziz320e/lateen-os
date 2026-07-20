/** @module memory/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  InstitutionalMemoryId,
  KnowledgeEntryId,
  OrganizationId,
  RuntimeSessionId,
  WorkingMemoryId,
} from '../shared/identifiers.js';

export type { WorkingMemoryId };

/** Reference to institutional or runtime memory artifact. */
export interface MemoryReference {
  readonly type: 'institutional_memory' | 'knowledge_entry' | 'runtime';
  readonly institutionalMemoryId?: InstitutionalMemoryId;
  readonly knowledgeEntryId?: KnowledgeEntryId;
  readonly label?: string;
}

/** Bounded context window for agent working memory. */
export interface ContextWindow {
  readonly maxTokens?: number;
  readonly maxItems?: number;
  readonly references: readonly MemoryReference[];
}

/** Short-lived working memory for an active session (not Institutional Memory). */
export interface WorkingMemory extends TenantAuditableEntity<WorkingMemoryId> {
  readonly sessionId: RuntimeSessionId;
  readonly contextWindow: ContextWindow;
  readonly entries: readonly MemoryReference[];
}

export type { OrganizationId };
