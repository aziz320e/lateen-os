/** @module tenants/repository */
import type { Repository } from '../shared/repository.js';
import type { EnvironmentId, OrganizationId, TenantId } from '../shared/identifiers.js';
import type { Environment, Tenant } from './types.js';

export interface TenantRepository extends Repository<Tenant, TenantId> {
  findAll(organizationId: OrganizationId): Promise<readonly Tenant[]>;
}

export interface EnvironmentRepository extends Repository<Environment, EnvironmentId> {
  findAll(organizationId: OrganizationId): Promise<readonly Environment[]>;
  findByTenant(organizationId: OrganizationId, tenantId: TenantId): Promise<readonly Environment[]>;
}
