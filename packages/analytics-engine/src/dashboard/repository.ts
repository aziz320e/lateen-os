/** @module dashboard/repository */
import type { Repository } from '../shared/repository.js';
import type { DashboardId, OrganizationId } from '../shared/identifiers.js';
import type { Dashboard, DashboardType } from './types.js';

export interface DashboardRepository extends Repository<Dashboard, DashboardId> {
  findAll(organizationId: OrganizationId): Promise<readonly Dashboard[]>;
  findByType(organizationId: OrganizationId, dashboardType: DashboardType): Promise<readonly Dashboard[]>;
}
