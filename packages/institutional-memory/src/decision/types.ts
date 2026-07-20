/** @module decision/types */
import type { ConfidenceScore } from '../confidence/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DecisionRecordId, EmployeeId, OrganizationId } from '../shared/identifiers.js';
import type { DateOnly } from '@lateen-os/shared-kernel/time';

export type { DecisionRecordId };

export type DecisionRecordStatus = 'proposed' | 'approved' | 'implemented' | 'reviewed' | 'superseded';

/** Record of a significant organizational decision and its rationale. */
export interface DecisionRecord extends TenantAuditableEntity<DecisionRecordId> {
  readonly decision: string;
  readonly reason: string;
  readonly alternatives?: readonly string[];
  readonly outcome?: string;
  readonly ownerId?: EmployeeId;
  readonly reviewDate?: DateOnly;
  readonly confidence?: ConfidenceScore;
  readonly status: DecisionRecordStatus;
}

export type { OrganizationId, EmployeeId };
