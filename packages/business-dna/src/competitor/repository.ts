/** @module competitor/repository */
import type { OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Competitor, CompetitorId, CompetitorStatus } from './types.js';

export interface CompetitorRepository extends Repository<Competitor, CompetitorId> {
  findAll(organizationId: OrganizationId): Promise<readonly Competitor[]>;
  findByStatus(organizationId: OrganizationId, status: CompetitorStatus): Promise<readonly Competitor[]>;
  findByName(organizationId: OrganizationId, name: string): Promise<Competitor | null>;
}
