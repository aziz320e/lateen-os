/**
 * Real Tenant Registry and Environment Registry — a tenant's guarded
 * status lifecycle, and the deployment environments scoped to it.
 *
 * @module tenants/engine.impl
 */
import type { AdminEventBus } from '../events/admin-event-bus.js';
import { EnvironmentNotFoundError, InvalidTenantTransitionError, TenantNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { EnvironmentId, OrganizationId, TenantId } from '../shared/identifiers.js';
import type { EnvironmentRepository, TenantRepository } from './repository.js';
import type { Environment, EnvironmentType, Tenant, TenantStatus } from './types.js';

const TENANT_TRANSITIONS: Readonly<Record<TenantStatus, readonly TenantStatus[]>> = {
  active: ['suspended', 'archived'],
  suspended: ['active', 'archived'],
  archived: [],
};

/** Whether a tenant may transition from one status to another. */
export function canTransitionTenant(from: TenantStatus, to: TenantStatus): boolean {
  return TENANT_TRANSITIONS[from].includes(to);
}

export interface CreateTenantInput {
  readonly name: string;
}

export interface CreateEnvironmentInput {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly environmentType: EnvironmentType;
}

export interface TenantEngine {
  createTenant(organizationId: OrganizationId, input: CreateTenantInput): Promise<Tenant>;
  suspendTenant(organizationId: OrganizationId, tenantId: TenantId): Promise<Tenant>;
  reactivateTenant(organizationId: OrganizationId, tenantId: TenantId): Promise<Tenant>;
  archiveTenant(organizationId: OrganizationId, tenantId: TenantId): Promise<Tenant>;
  getTenant(organizationId: OrganizationId, tenantId: TenantId): Promise<Tenant | null>;
  listTenants(organizationId: OrganizationId): Promise<readonly Tenant[]>;

  createEnvironment(organizationId: OrganizationId, input: CreateEnvironmentInput): Promise<Environment>;
  disableEnvironment(organizationId: OrganizationId, environmentId: EnvironmentId): Promise<Environment>;
  enableEnvironment(organizationId: OrganizationId, environmentId: EnvironmentId): Promise<Environment>;
  getEnvironment(organizationId: OrganizationId, environmentId: EnvironmentId): Promise<Environment | null>;
  listEnvironmentsForTenant(organizationId: OrganizationId, tenantId: TenantId): Promise<readonly Environment[]>;
  listAllEnvironments(organizationId: OrganizationId): Promise<readonly Environment[]>;
}

/** Creates a real {@link TenantEngine}. */
export function createTenantEngine(
  tenantRepository: TenantRepository,
  environmentRepository: EnvironmentRepository,
  eventBus?: AdminEventBus,
  now: () => string = nowIso,
): TenantEngine {
  async function requireTenant(organizationId: OrganizationId, tenantId: TenantId): Promise<Tenant> {
    const tenant = await tenantRepository.findById(organizationId, tenantId);
    if (!tenant) throw new TenantNotFoundError(tenantId);
    return tenant;
  }

  async function transitionTenant(organizationId: OrganizationId, tenantId: TenantId, to: TenantStatus): Promise<Tenant> {
    const tenant = await requireTenant(organizationId, tenantId);
    if (!canTransitionTenant(tenant.status, to)) {
      throw new InvalidTenantTransitionError(tenantId, tenant.status, to);
    }
    const updated: Tenant = { ...tenant, status: to, updatedAt: now() };
    await tenantRepository.save(updated);
    return updated;
  }

  async function requireEnvironment(organizationId: OrganizationId, environmentId: EnvironmentId): Promise<Environment> {
    const environment = await environmentRepository.findById(organizationId, environmentId);
    if (!environment) throw new EnvironmentNotFoundError(environmentId);
    return environment;
  }

  return {
    async createTenant(organizationId, input) {
      const timestamp = now();
      const tenant: Tenant = {
        id: generateId('admin-tenant'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        status: 'active',
      };
      await tenantRepository.save(tenant);
      eventBus?.publish('tenant.created', { organizationId, tenantId: tenant.id, name: tenant.name });
      return tenant;
    },

    async suspendTenant(organizationId, tenantId) {
      return transitionTenant(organizationId, tenantId, 'suspended');
    },

    async reactivateTenant(organizationId, tenantId) {
      return transitionTenant(organizationId, tenantId, 'active');
    },

    async archiveTenant(organizationId, tenantId) {
      return transitionTenant(organizationId, tenantId, 'archived');
    },

    async getTenant(organizationId, tenantId) {
      return tenantRepository.findById(organizationId, tenantId);
    },

    async listTenants(organizationId) {
      return tenantRepository.findAll(organizationId);
    },

    async createEnvironment(organizationId, input) {
      await requireTenant(organizationId, input.tenantId);
      const timestamp = now();
      const environment: Environment = {
        id: generateId('admin-environment'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        tenantId: input.tenantId,
        name: input.name,
        environmentType: input.environmentType,
        status: 'active',
      };
      await environmentRepository.save(environment);
      return environment;
    },

    async disableEnvironment(organizationId, environmentId) {
      const environment = await requireEnvironment(organizationId, environmentId);
      const updated: Environment = { ...environment, status: 'disabled', updatedAt: now() };
      await environmentRepository.save(updated);
      return updated;
    },

    async enableEnvironment(organizationId, environmentId) {
      const environment = await requireEnvironment(organizationId, environmentId);
      const updated: Environment = { ...environment, status: 'active', updatedAt: now() };
      await environmentRepository.save(updated);
      return updated;
    },

    async getEnvironment(organizationId, environmentId) {
      return environmentRepository.findById(organizationId, environmentId);
    },

    async listEnvironmentsForTenant(organizationId, tenantId) {
      return environmentRepository.findByTenant(organizationId, tenantId);
    },

    async listAllEnvironments(organizationId) {
      return environmentRepository.findAll(organizationId);
    },
  };
}
