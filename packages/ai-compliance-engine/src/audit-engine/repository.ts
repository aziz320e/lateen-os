/** @module audit-engine/repository */
import type { Repository } from '../shared/repository.js';
import type { ComplianceAuditId, ComplianceFrameworkId, OrganizationId } from '../shared/identifiers.js';
import type { ComplianceAudit, ComplianceAuditStatus } from './types.js';

export interface ComplianceAuditRepository extends Repository<ComplianceAudit, ComplianceAuditId> {
  findAll(organizationId: OrganizationId): Promise<readonly ComplianceAudit[]>;
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly ComplianceAudit[]>;
  findByStatus(organizationId: OrganizationId, status: ComplianceAuditStatus): Promise<readonly ComplianceAudit[]>;
}
