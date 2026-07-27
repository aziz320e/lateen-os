/** @module control-mapping/repository */
import type { Repository } from '../shared/repository.js';
import type { ComplianceControlId, ControlMappingId, OrganizationId } from '../shared/identifiers.js';
import type { ControlMapping, MappedRecordType } from './types.js';

export interface ControlMappingRepository extends Repository<ControlMapping, ControlMappingId> {
  findAll(organizationId: OrganizationId): Promise<readonly ControlMapping[]>;
  findByControlId(organizationId: OrganizationId, controlId: ComplianceControlId): Promise<readonly ControlMapping[]>;
  findByMappedRecord(organizationId: OrganizationId, mappedType: MappedRecordType, mappedId: string): Promise<readonly ControlMapping[]>;
}
