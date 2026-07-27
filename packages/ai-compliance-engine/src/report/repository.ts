/** @module report/repository */
import type { Repository } from '../shared/repository.js';
import type { ComplianceFrameworkId, ComplianceReportId, OrganizationId } from '../shared/identifiers.js';
import type { ComplianceReport } from './types.js';

export interface ComplianceReportRepository extends Repository<ComplianceReport, ComplianceReportId> {
  findAll(organizationId: OrganizationId): Promise<readonly ComplianceReport[]>;
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly ComplianceReport[]>;
}
