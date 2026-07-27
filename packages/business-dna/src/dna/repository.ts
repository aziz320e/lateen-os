/** @module dna/repository */
import type { OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessDnaProfile, BusinessDnaProfileId } from './types.js';

/** Persistence port for the Business DNA Profile singleton (id === organizationId). */
export interface BusinessDnaProfileRepository extends Repository<BusinessDnaProfile, BusinessDnaProfileId> {
  findByOrganization(organizationId: OrganizationId): Promise<BusinessDnaProfile | null>;
}
