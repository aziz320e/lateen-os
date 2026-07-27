/** @module business-profile/repository */
import type { OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessProfile } from './types.js';
import type { BusinessProfileId } from '../shared/identifiers.js';

/** Persistence port for the Business Profile singleton (id === organizationId). */
export interface BusinessProfileRepository extends Repository<BusinessProfile, BusinessProfileId> {
  findByOrganization(organizationId: OrganizationId): Promise<BusinessProfile | null>;
}
