/** @module registry/repository */
import type { Repository } from '../shared/repository.js';
import type { WorkerId } from '../shared/identifiers.js';
import type { WorkerRegistration, WorkerRegistrationId, WorkerRegistry } from './types.js';
import type { OrganizationId } from '../shared/identifiers.js';

export interface WorkerRegistrationRepository extends Repository<WorkerRegistration, WorkerRegistrationId> {
  findByWorkerId(organizationId: OrganizationId, workerId: WorkerId): Promise<WorkerRegistration | null>;
}

export interface WorkerRegistryRepository {
  findByOrganization(organizationId: OrganizationId): Promise<WorkerRegistry | null>;
  save(registry: WorkerRegistry): Promise<void>;
}
