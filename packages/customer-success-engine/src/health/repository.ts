/** @module health/repository */
import type { Repository } from '../shared/repository.js';
import type { HealthSnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { HealthSnapshot } from './types.js';

export interface HealthSnapshotRepository extends Repository<HealthSnapshot, HealthSnapshotId> {
  findAll(organizationId: OrganizationId): Promise<readonly HealthSnapshot[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<readonly HealthSnapshot[]>;
}
