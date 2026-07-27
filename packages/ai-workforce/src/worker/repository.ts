/** @module worker/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { AIWorker, WorkerId, WorkerStatus } from './types.js';

export interface WorkerRepository extends Repository<AIWorker, WorkerId> {
  findAll(organizationId: OrganizationId): Promise<readonly AIWorker[]>;
  findByStatus(organizationId: OrganizationId, status: WorkerStatus): Promise<readonly AIWorker[]>;
}
