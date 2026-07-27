/** @module audience/repository */
import type { Repository } from '../shared/repository.js';
import type { AudienceId, OrganizationId } from '../shared/identifiers.js';
import type { Audience, AudienceStatus, AudienceType } from './types.js';

export interface AudienceRepository extends Repository<Audience, AudienceId> {
  findAll(organizationId: OrganizationId): Promise<readonly Audience[]>;
  findByStatus(organizationId: OrganizationId, status: AudienceStatus): Promise<readonly Audience[]>;
  findByType(organizationId: OrganizationId, audienceType: AudienceType): Promise<readonly Audience[]>;
}
