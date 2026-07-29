/**
 * Real Service Discovery engine — the registry of backend services
 * the Runtime Dispatcher is allowed to route to. `serviceName` values
 * are opaque strings matching `Route.targetService`.
 *
 * @module discovery/engine.impl
 */
import { ServiceRegistrationNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { ServiceRegistrationRepository } from './repository.js';
import type { ServiceRegistration } from './types.js';

export interface ServiceDiscoveryEngine {
  registerService(organizationId: OrganizationId, serviceName: string): Promise<ServiceRegistration>;
  markAvailable(organizationId: OrganizationId, serviceName: string): Promise<ServiceRegistration>;
  markUnavailable(organizationId: OrganizationId, serviceName: string): Promise<ServiceRegistration>;
  isAvailable(organizationId: OrganizationId, serviceName: string): Promise<boolean>;
  get(organizationId: OrganizationId, serviceName: string): Promise<ServiceRegistration | null>;
  list(organizationId: OrganizationId): Promise<readonly ServiceRegistration[]>;
}

/** Creates a real {@link ServiceDiscoveryEngine}. */
export function createServiceDiscoveryEngine(repository: ServiceRegistrationRepository, now: () => string = nowIso): ServiceDiscoveryEngine {
  async function requireRegistration(organizationId: OrganizationId, serviceName: string): Promise<ServiceRegistration> {
    const registration = await repository.findByServiceName(organizationId, serviceName);
    if (!registration) throw new ServiceRegistrationNotFoundError(serviceName);
    return registration;
  }

  return {
    async registerService(organizationId, serviceName) {
      const existing = await repository.findByServiceName(organizationId, serviceName);
      if (existing) return existing;
      const timestamp = now();
      const registration: ServiceRegistration = {
        id: generateId('gateway-service'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        serviceName,
        status: 'available',
      };
      await repository.save(registration);
      return registration;
    },

    async markAvailable(organizationId, serviceName) {
      const registration = await requireRegistration(organizationId, serviceName);
      const updated: ServiceRegistration = { ...registration, status: 'available', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async markUnavailable(organizationId, serviceName) {
      const registration = await requireRegistration(organizationId, serviceName);
      const updated: ServiceRegistration = { ...registration, status: 'unavailable', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async isAvailable(organizationId, serviceName) {
      const registration = await repository.findByServiceName(organizationId, serviceName);
      return registration?.status === 'available';
    },

    async get(organizationId, serviceName) {
      return repository.findByServiceName(organizationId, serviceName);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
