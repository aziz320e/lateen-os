/** @module remediation/repository */
import type { Repository } from '../shared/repository.js';
import type { ComplianceFrameworkId, OrganizationId, RemediationId } from '../shared/identifiers.js';
import type { Remediation, RemediationStatus } from './types.js';

export interface RemediationRepository extends Repository<Remediation, RemediationId> {
  findAll(organizationId: OrganizationId): Promise<readonly Remediation[]>;
  findByStatus(organizationId: OrganizationId, status: RemediationStatus): Promise<readonly Remediation[]>;
  findByReferenceId(organizationId: OrganizationId, referenceId: string): Promise<readonly Remediation[]>;
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly Remediation[]>;
}
