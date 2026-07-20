/**
 * Memory query result types.
 *
 * @module queries/types
 */

import type { TimeRange } from '@lateen-os/shared-kernel/common';
import type { InstitutionalMemory } from '../memory/types.js';
import type { KnowledgeEntry } from '../knowledge/types.js';
import type { DecisionRecord } from '../decision/types.js';
import type { LessonLearned } from '../lesson/types.js';
import type { ResearchRecord } from '../research/types.js';
import type { IncidentRecord } from '../incident/types.js';
import type { Playbook } from '../playbook/types.js';
import type { Template } from '../template/types.js';
import type { GraphNodeType } from '../shared/identifiers.js';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { MemoryTag } from '../shared/primitives.js';

/** Unified memory search result across aggregate types. */
export interface MemorySearchResult {
  readonly institutionalMemories: readonly InstitutionalMemory[];
  readonly knowledgeEntries: readonly KnowledgeEntry[];
  readonly decisionRecords: readonly DecisionRecord[];
  readonly lessonsLearned: readonly LessonLearned[];
  readonly researchRecords: readonly ResearchRecord[];
  readonly incidentRecords: readonly IncidentRecord[];
  readonly playbooks: readonly Playbook[];
  readonly templates: readonly Template[];
}

/** Memory artifacts linked to a Business DNA or graph entity. */
export interface EntityMemoryResult {
  readonly nodeType: GraphNodeType;
  readonly entityId: Identifier;
  readonly results: MemorySearchResult;
}

/** Memory artifacts matching tag filters. */
export interface TaggedMemoryResult {
  readonly tags: readonly MemoryTag[];
  readonly results: MemorySearchResult;
}

/** Memory artifacts within a time range. */
export interface TimeRangedMemoryResult {
  readonly range: TimeRange;
  readonly results: MemorySearchResult;
}
