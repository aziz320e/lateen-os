/** @module dashboard/repository */
import type { Repository } from '../shared/repository.js';
import type { DashboardSnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { DashboardSnapshot } from './types.js';

export interface DashboardSnapshotRepository extends Repository<DashboardSnapshot, DashboardSnapshotId> {
  findAll(organizationId: OrganizationId): Promise<readonly DashboardSnapshot[]>;
}
