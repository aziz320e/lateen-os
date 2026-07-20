/** @module incident/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { IncidentRecordId, OrganizationId } from '../shared/identifiers.js';
import type { MemoryTag } from '../shared/primitives.js';

export type { IncidentRecordId };

export type IncidentSeverity = 'critical' | 'major' | 'minor' | 'informational';

export type IncidentRecordStatus = 'open' | 'investigating' | 'resolved' | 'closed' | 'archived';

/** Record of an operational or safety incident and institutional response. */
export interface IncidentRecord extends TenantAuditableEntity<IncidentRecordId> {
  readonly title: string;
  readonly severity: IncidentSeverity;
  readonly impact: string;
  readonly cause: string;
  readonly resolution: string;
  readonly prevention: string;
  readonly tags: readonly MemoryTag[];
  readonly status: IncidentRecordStatus;
}

export type { OrganizationId };
