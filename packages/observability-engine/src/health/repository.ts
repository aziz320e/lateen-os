/** @module health/repository */
import type { Repository } from '../shared/repository.js';
import type { HealthCheckId, OrganizationId } from '../shared/identifiers.js';
import type { HealthCheck } from './types.js';

export interface HealthCheckRepository extends Repository<HealthCheck, HealthCheckId> {
  findAll(organizationId: OrganizationId): Promise<readonly HealthCheck[]>;
  findByComponent(organizationId: OrganizationId, component: string): Promise<readonly HealthCheck[]>;
}
