/** @module queries/knowledge-runtime-types */
import type { MemoryCategory } from '../classification/types.js';
import type { KnowledgeEntry, KnowledgeEntryStatus, KnowledgeType } from '../knowledge/types.js';
import type { KnowledgeSearchMatch, SearchKnowledgeQuery } from '../knowledge/search.impl.js';
import type { KnowledgeEntryId, OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';

export interface FindKnowledgeQuery extends OrganizationScopedQuery {
  readonly knowledgeType?: KnowledgeType;
  readonly status?: KnowledgeEntryStatus;
  readonly category?: MemoryCategory;
}

export interface FindKnowledgeResult {
  readonly entries: readonly KnowledgeEntry[];
  readonly total: number;
}

export type FindTypedKnowledgeQuery = OrganizationScopedQuery;

export interface FindRelatedKnowledgeQuery {
  readonly organizationId: OrganizationId;
  readonly knowledgeEntryId: KnowledgeEntryId;
}

export interface FindRelatedKnowledgeResult {
  readonly entries: readonly KnowledgeEntry[];
}

export interface FindExpiringKnowledgeQuery {
  readonly organizationId: OrganizationId;
  readonly withinDays: number;
  readonly at?: string;
}

export interface FindExpiringKnowledgeResult {
  readonly entries: readonly KnowledgeEntry[];
}

export interface SearchKnowledgeParams extends SearchKnowledgeQuery {
  readonly organizationId: OrganizationId;
}

export interface SearchKnowledgeResult {
  readonly matches: readonly KnowledgeSearchMatch[];
  readonly total: number;
}

export type { OrganizationId, KnowledgeEntryId };
