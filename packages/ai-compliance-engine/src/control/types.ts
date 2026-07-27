/** @module control/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ComplianceControlId, ComplianceFrameworkId } from '../shared/identifiers.js';
import type { ComplianceControlType } from '../framework/types.js';

export type { ComplianceControlId, ComplianceControlType };

export type ComplianceControlStatus = 'draft' | 'approved' | 'retired';

export type ControlImplementationStatus = 'implemented' | 'partially_implemented' | 'not_implemented';

/** A single compliance control belonging (optionally) to a framework. */
export interface ComplianceControl extends TenantAuditableEntity<ComplianceControlId> {
  readonly frameworkId?: ComplianceFrameworkId;
  readonly controlType: ComplianceControlType;
  readonly name: string;
  readonly description?: string;
  readonly status: ComplianceControlStatus;
  readonly implementationStatus: ControlImplementationStatus;
  /** When set and in the past (relative to the assessing/analyzing clock), the control is treated as expired. */
  readonly expiresAt?: string;
}
