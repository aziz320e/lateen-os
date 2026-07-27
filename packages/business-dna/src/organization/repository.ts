/**
 * Organization repository port.
 *
 * @module organization/repository
 */

import type { Repository } from '../shared/repository.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Organization, OrganizationStatus } from './types.js';

/**
 * Persistence port for the Organization aggregate root. Organization is the
 * tenant root — it is scoped to itself, so `findById(organizationId, id)`
 * is only ever called with `organizationId === id`. `findByCode`,
 * `findByDomain`, `findByStatus`, and `findAll` are unscoped lookups across
 * every organization, since there is no higher tenant to scope under.
 */
export interface OrganizationRepository extends Repository<Organization, OrganizationId> {
  findByCode(code: BusinessCode): Promise<Organization | null>;
  findByDomain(domain: string): Promise<Organization | null>;
  findByStatus(status: OrganizationStatus): Promise<readonly Organization[]>;
  findAll(): Promise<readonly Organization[]>;
}
