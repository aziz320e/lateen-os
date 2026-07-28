/** @module report/repository */
import type { Repository } from '../shared/repository.js';
import type { FinanceReportId, OrganizationId } from '../shared/identifiers.js';
import type { FinanceReport, FinanceReportType } from './types.js';

export interface FinanceReportRepository extends Repository<FinanceReport, FinanceReportId> {
  findAll(organizationId: OrganizationId): Promise<readonly FinanceReport[]>;
  findByType(organizationId: OrganizationId, reportType: FinanceReportType): Promise<readonly FinanceReport[]>;
}
