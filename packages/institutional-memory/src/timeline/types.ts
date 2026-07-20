/** @module timeline/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  MemoryTimelineId,
  OrganizationId,
  TimelineEventId,
} from '../shared/identifiers.js';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { TimelineEventId, MemoryTimelineId };

/** Type of artifact referenced by a timeline event. */
export type TimelineEventSubjectType =
  | 'institutional_memory'
  | 'knowledge_entry'
  | 'decision_record'
  | 'lesson_learned'
  | 'meeting_record'
  | 'incident_record'
  | 'playbook'
  | 'research_record'
  | 'template'
  | 'document_reference';

/** A single event on an institutional memory timeline. */
export interface TimelineEvent {
  readonly eventId: TimelineEventId;
  readonly occurredAt: Timestamp;
  readonly title: string;
  readonly description?: string;
  readonly subjectType: TimelineEventSubjectType;
  readonly subjectId: Identifier;
}

/** Chronological view of institutional memory artifacts for an organization or entity. */
export interface MemoryTimeline extends TenantAuditableEntity<MemoryTimelineId> {
  readonly title: string;
  readonly subjectType?: TimelineEventSubjectType;
  readonly subjectId?: Identifier;
  readonly events: readonly TimelineEvent[];
}

export type { OrganizationId };
