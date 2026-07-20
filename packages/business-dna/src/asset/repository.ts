/** @module asset/repository */
import type { AssetId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Asset } from './types.js';

export interface AssetRepository extends Repository<Asset, AssetId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Asset | null>;
}
