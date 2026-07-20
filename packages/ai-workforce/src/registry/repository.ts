/** @module registry/repository */
import type { Repository } from '../shared/repository.js';
import type { WorkerRegistration, WorkerRegistrationId, WorkerRegistry } from './types.js';
import type { OrganizationId } from '../shared/identifiers.js';

export type WorkerRegistrationRepository = Repository<WorkerRegistration, WorkerRegistrationId>;

export interface WorkerRegistryRepository {
  findByOrganization(organizationId: OrganizationId): Promise<WorkerRegistry | null>;
  save(registry: WorkerRegistry): Promise<void>;
}
