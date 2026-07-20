/**
 * Institutional Memory query port — read-side search and discovery.
 *
 * Implementations live outside this package. No query logic provided here.
 *
 * @module queries/memory-queries
 */

import type { TimeRange } from '@lateen-os/shared-kernel/common';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { DecisionRecord } from '../decision/types.js';
import type { IncidentRecord } from '../incident/types.js';
import type { KnowledgeEntry } from '../knowledge/types.js';
import type { LessonLearned } from '../lesson/types.js';
import type { InstitutionalMemory } from '../memory/types.js';
import type { Playbook } from '../playbook/types.js';
import type { ResearchRecord } from '../research/types.js';
import type { GraphNodeType, OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { MemoryTag } from '../shared/primitives.js';
import type { Template } from '../template/types.js';
import type {
  EntityMemoryResult,
  MemorySearchResult,
  TaggedMemoryResult,
  TimeRangedMemoryResult,
} from './types.js';

/** Read-side query port for institutional memory discovery. */
export interface MemoryQueries {
  /** Search across all memory aggregate types. */
  findMemories(query: OrganizationScopedQuery): Promise<MemorySearchResult>;

  findLessons(query: OrganizationScopedQuery): Promise<readonly LessonLearned[]>;

  findResearch(query: OrganizationScopedQuery): Promise<readonly ResearchRecord[]>;

  findDecisions(query: OrganizationScopedQuery): Promise<readonly DecisionRecord[]>;

  findIncidents(query: OrganizationScopedQuery): Promise<readonly IncidentRecord[]>;

  findKnowledge(query: OrganizationScopedQuery): Promise<readonly KnowledgeEntry[]>;

  findPlaybooks(query: OrganizationScopedQuery): Promise<readonly Playbook[]>;

  findTemplates(query: OrganizationScopedQuery): Promise<readonly Template[]>;

  /** Memory artifacts related to a Business DNA / domain graph entity. */
  findByEntity(
    organizationId: OrganizationId,
    nodeType: GraphNodeType,
    entityId: Identifier,
  ): Promise<EntityMemoryResult>;

  /** Memory artifacts matching any of the given tags. */
  findByTags(
    organizationId: OrganizationId,
    tags: readonly MemoryTag[],
  ): Promise<TaggedMemoryResult>;

  /** Memory artifacts created or updated within a time range. */
  findByTimeRange(
    organizationId: OrganizationId,
    range: TimeRange,
  ): Promise<TimeRangedMemoryResult>;

  /** Root institutional memory records only. */
  findInstitutionalMemories(
    query: OrganizationScopedQuery,
  ): Promise<readonly InstitutionalMemory[]>;
}
