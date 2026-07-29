/** @module feature-flags/repository */
import type { Repository } from '../shared/repository.js';
import type { FeatureFlagId, OrganizationId } from '../shared/identifiers.js';
import type { FeatureFlag } from './types.js';

export interface FeatureFlagRepository extends Repository<FeatureFlag, FeatureFlagId> {
  findAll(organizationId: OrganizationId): Promise<readonly FeatureFlag[]>;
  findByKey(organizationId: OrganizationId, key: string): Promise<readonly FeatureFlag[]>;
}
