/** @module graph/repository */
import type { DomainGraphId, OrganizationId } from '../shared/identifiers.js';
import type { DomainGraph, DomainGraphStatus } from './types.js';

/** Persistence port for the real, lifecycle-managed {@link DomainGraph} aggregate. */
export interface DomainGraphRepository {
  findById(organizationId: OrganizationId, id: DomainGraphId): Promise<DomainGraph | null>;
  save(graph: DomainGraph): Promise<void>;
  delete(organizationId: OrganizationId, id: DomainGraphId): Promise<void>;
  findByOrganization(organizationId: OrganizationId): Promise<readonly DomainGraph[]>;
  findByStatus(organizationId: OrganizationId, status: DomainGraphStatus): Promise<readonly DomainGraph[]>;
}
