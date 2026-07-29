/** @module organizations/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { Organization } from './types.js';

/**
 * Deliberately not organization-scoped in the usual sense: an
 * `Organization` record IS the tenancy boundary, so `findAll()` lists
 * every platform organization, not one organization's children.
 */
export interface OrganizationRepository extends Repository<Organization, OrganizationId> {
  findAll(): Promise<readonly Organization[]>;
}
