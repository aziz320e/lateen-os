/** @module identity/repository */
import type { Repository } from '../shared/repository.js';
import type { IdentityId, OrganizationId } from '../shared/identifiers.js';
import type { Identity, IdentityStatus, IdentityType } from './types.js';

export interface IdentityRepository extends Repository<Identity, IdentityId> {
  findAll(organizationId: OrganizationId): Promise<readonly Identity[]>;
  findByType(organizationId: OrganizationId, identityType: IdentityType): Promise<readonly Identity[]>;
  findByStatus(organizationId: OrganizationId, status: IdentityStatus): Promise<readonly Identity[]>;
  findBySecretHash(organizationId: OrganizationId, secretHash: string): Promise<Identity | null>;
}
