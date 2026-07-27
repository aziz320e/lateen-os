/**
 * Identifier types for the Institutional Memory bounded context.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type {
  AgentId,
  CustomerId,
  EmployeeId,
  KpiId,
  MachineId,
  OrganizationId,
  ProductId,
  ProjectId,
} from '@lateen-os/business-dna';

export type { GraphNodeId, GraphNodeType } from '@lateen-os/domain-graph';

/** Institutional Memory root aggregate identifier. */
export type InstitutionalMemoryId = Identifier;

/** Knowledge entry aggregate identifier. */
export type KnowledgeEntryId = Identifier;

/** Decision record aggregate identifier. */
export type DecisionRecordId = Identifier;

/** Lesson learned aggregate identifier. */
export type LessonLearnedId = Identifier;

/** Meeting record aggregate identifier. */
export type MeetingRecordId = Identifier;

/** Incident record aggregate identifier. */
export type IncidentRecordId = Identifier;

/** Playbook aggregate identifier. */
export type PlaybookId = Identifier;

/** Research record aggregate identifier. */
export type ResearchRecordId = Identifier;

/** Template aggregate identifier. */
export type TemplateId = Identifier;

/** Document reference aggregate identifier. */
export type DocumentReferenceId = Identifier;

/** Timeline event identifier. */
export type TimelineEventId = Identifier;

/** Memory timeline identifier. */
export type MemoryTimelineId = Identifier;

/** Action item identifier within a meeting record. */
export type ActionItemId = Identifier;

/** Playbook step identifier. */
export type PlaybookStepId = Identifier;

/** Evidence record identifier. */
export type EvidenceId = Identifier;

/** Immutable knowledge entry revision identifier. */
export type KnowledgeEntryVersionId = Identifier;
