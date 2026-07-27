/** @module kpi/repository */
import type { Repository } from '../shared/repository.js';
import type { KpiSnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { KpiSnapshot, KpiType } from './types.js';

export interface KpiSnapshotRepository extends Repository<KpiSnapshot, KpiSnapshotId> {
  findAll(organizationId: OrganizationId): Promise<readonly KpiSnapshot[]>;
  findByType(organizationId: OrganizationId, kpiType: KpiType): Promise<readonly KpiSnapshot[]>;
}
