/** @module control-mapping/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ComplianceControlId, ControlMappingId } from '../shared/identifiers.js';

export type { ControlMappingId };

/** The five kinds of artifact a compliance control can be deterministically mapped to. */
export type MappedRecordType = 'policy' | 'governance_rule' | 'security_control' | 'workflow' | 'business_process';

/** A single deterministic mapping between a compliance control and another platform artifact. */
export interface ControlMapping extends TenantAuditableEntity<ControlMappingId> {
  readonly controlId: ComplianceControlId;
  readonly mappedType: MappedRecordType;
  readonly mappedId: string;
}
