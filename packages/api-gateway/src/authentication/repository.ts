/** @module authentication/repository */
import type { Repository } from '../shared/repository.js';
import type { ApiKeyId, OrganizationId } from '../shared/identifiers.js';
import type { ApiKey } from './types.js';

export interface ApiKeyRepository extends Repository<ApiKey, ApiKeyId> {
  findAll(organizationId: OrganizationId): Promise<readonly ApiKey[]>;
  findByHash(organizationId: OrganizationId, keyHash: string): Promise<ApiKey | null>;
}
