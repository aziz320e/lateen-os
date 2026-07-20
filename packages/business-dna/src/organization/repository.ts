/**
 * Organization repository port.
 *
 * @module organization/repository
 */

import type { Repository } from '../shared/repository.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Organization } from './types.js';

/** Persistence port for the Organization aggregate root. */
export interface OrganizationRepository extends Repository<Organization, OrganizationId> {
  findByCode(code: BusinessCode): Promise<Organization | null>;
}
