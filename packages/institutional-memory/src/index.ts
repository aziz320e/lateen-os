/**
 * @lateen-os/institutional-memory — Institutional Memory Engine
 *
 * Long-term organizational knowledge — not chat history, not logs.
 * Domain models, events, repository ports, and query ports only.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';

export * as classification from './classification/index.js';
export * as confidence from './confidence/index.js';
export * as memory from './memory/index.js';
export * as knowledge from './knowledge/index.js';
export * as decision from './decision/index.js';
export * as lesson from './lesson/index.js';
export * as meeting from './meeting/index.js';
export * as incident from './incident/index.js';
export * as playbook from './playbook/index.js';
export * as research from './research/index.js';
export * as template from './template/index.js';
export * as document from './document/index.js';
export * as timeline from './timeline/index.js';
export * as queries from './queries/index.js';

export type { InstitutionalMemory } from './memory/types.js';
export type { KnowledgeEntry, KnowledgeType } from './knowledge/types.js';
export type { DecisionRecord } from './decision/types.js';
export type { LessonLearned } from './lesson/types.js';
export type { MeetingRecord } from './meeting/types.js';
export type { IncidentRecord } from './incident/types.js';
export type { Playbook } from './playbook/types.js';
export type { ResearchRecord } from './research/types.js';
export type { Template } from './template/types.js';
export type { DocumentReference } from './document/types.js';
export type { TimelineEvent, MemoryTimeline } from './timeline/types.js';

export type {
  MemoryCategory,
  ImportanceLevel,
  Visibility,
  RetentionPolicy,
} from './classification/types.js';

export type {
  ConfidenceScore,
  Evidence,
  EvidenceSource,
} from './confidence/types.js';

export type { MemoryQueries } from './queries/memory-queries.js';

export type { InstitutionalMemoryRepository } from './memory/repository.js';
export type { KnowledgeEntryRepository } from './knowledge/repository.js';
export type { DecisionRecordRepository } from './decision/repository.js';
export type { LessonLearnedRepository } from './lesson/repository.js';
export type { MeetingRecordRepository } from './meeting/repository.js';
export type { IncidentRecordRepository } from './incident/repository.js';
export type { PlaybookRepository } from './playbook/repository.js';
export type { ResearchRecordRepository } from './research/repository.js';
export type { TemplateRepository } from './template/repository.js';
export type { DocumentReferenceRepository } from './document/repository.js';
export type { MemoryTimelineRepository } from './timeline/repository.js';

export type {
  InstitutionalMemoryId,
  KnowledgeEntryId,
  DecisionRecordId,
  LessonLearnedId,
  MeetingRecordId,
  IncidentRecordId,
  PlaybookId,
  ResearchRecordId,
  TemplateId,
  DocumentReferenceId,
  OrganizationId,
} from './shared/identifiers.js';
