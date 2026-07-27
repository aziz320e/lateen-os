/** @module report/repository */
import type { Repository } from '../shared/repository.js';
import type { AnalyticsReportId, OrganizationId } from '../shared/identifiers.js';
import type { AnalyticsReport, ReportFormat } from './types.js';

export interface AnalyticsReportRepository extends Repository<AnalyticsReport, AnalyticsReportId> {
  findAll(organizationId: OrganizationId): Promise<readonly AnalyticsReport[]>;
  findByFormat(organizationId: OrganizationId, format: ReportFormat): Promise<readonly AnalyticsReport[]>;
}
