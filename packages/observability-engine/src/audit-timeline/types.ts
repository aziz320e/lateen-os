/** @module audit-timeline/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AuditTimelineEntryId } from '../shared/identifiers.js';

export type { AuditTimelineEntryId };

/** The five real, integrated sources aggregated into the Audit Timeline. */
export type AuditTimelineSource = 'security' | 'governance' | 'compliance' | 'workflow' | 'communication';

/** A single, real audit timeline entry sourced from one integrated package. */
export interface AuditTimelineEntry extends TenantAuditableEntity<AuditTimelineEntryId> {
  readonly source: AuditTimelineSource;
  readonly label: string;
  readonly occurredAt: string;
  readonly referenceId: string;
}
