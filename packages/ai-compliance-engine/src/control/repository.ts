/** @module control/repository */
import type { Repository } from '../shared/repository.js';
import type { ComplianceControlId, ComplianceFrameworkId, OrganizationId } from '../shared/identifiers.js';
import type { ComplianceControl, ComplianceControlStatus, ComplianceControlType } from './types.js';

export interface ComplianceControlRepository extends Repository<ComplianceControl, ComplianceControlId> {
  findAll(organizationId: OrganizationId): Promise<readonly ComplianceControl[]>;
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly ComplianceControl[]>;
  findByType(organizationId: OrganizationId, controlType: ComplianceControlType): Promise<readonly ComplianceControl[]>;
  findByStatus(organizationId: OrganizationId, status: ComplianceControlStatus): Promise<readonly ComplianceControl[]>;
}
