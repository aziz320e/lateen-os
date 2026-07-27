/** @module snapshot/repository */
import type { Repository } from '../shared/repository.js';
import type { ObservabilitySnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { ObservabilitySnapshot, ObservabilitySnapshotCategory } from './types.js';

export interface ObservabilitySnapshotRepository extends Repository<ObservabilitySnapshot, ObservabilitySnapshotId> {
  findAll(organizationId: OrganizationId): Promise<readonly ObservabilitySnapshot[]>;
  findByCategory(organizationId: OrganizationId, category: ObservabilitySnapshotCategory): Promise<readonly ObservabilitySnapshot[]>;
}
