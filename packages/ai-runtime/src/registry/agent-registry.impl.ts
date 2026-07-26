/**
 * Real agent registration service — manages the one-per-organization
 * {@link AgentRegistry} document, appending/deactivating
 * {@link AgentRegistration} entries.
 *
 * @module registry/agent-registry.impl
 */
import { randomUUID } from 'node:crypto';
import type { OrganizationId, RuntimeAgentId } from '../shared/identifiers.js';
import type { AgentDescriptor, AgentRegistration, AgentRegistry } from './types.js';
import type { AgentRegistryRepository } from './repository.js';

export interface AgentRegistryService {
  register(organizationId: OrganizationId, descriptor: AgentDescriptor): Promise<AgentRegistration>;
  deactivate(organizationId: OrganizationId, runtimeAgentId: RuntimeAgentId): Promise<void>;
  getRegistry(organizationId: OrganizationId): Promise<AgentRegistry>;
}

/** Creates an {@link AgentRegistryService} backed by an {@link AgentRegistryRepository}. */
export function createAgentRegistryService(repository: AgentRegistryRepository): AgentRegistryService {
  async function loadOrCreate(organizationId: OrganizationId): Promise<AgentRegistry> {
    const existing = await repository.findById(organizationId, organizationId);
    if (existing) return existing;
    const now = new Date().toISOString();
    return {
      id: organizationId,
      organizationId,
      createdAt: now,
      updatedAt: now,
      registrations: [],
      version: 0,
    };
  }

  return {
    async register(organizationId, descriptor) {
      const registry = await loadOrCreate(organizationId);
      const now = new Date().toISOString();
      const registration: AgentRegistration = {
        id: randomUUID(),
        organizationId,
        createdAt: now,
        updatedAt: now,
        descriptor,
        active: true,
      };
      await repository.save({
        ...registry,
        updatedAt: now,
        registrations: [...registry.registrations, registration],
        version: registry.version + 1,
      });
      return registration;
    },

    async deactivate(organizationId, runtimeAgentId) {
      const registry = await loadOrCreate(organizationId);
      const now = new Date().toISOString();
      await repository.save({
        ...registry,
        updatedAt: now,
        registrations: registry.registrations.map((registration) =>
          registration.descriptor.runtimeAgentId === runtimeAgentId
            ? { ...registration, active: false, updatedAt: now }
            : registration,
        ),
        version: registry.version + 1,
      });
    },

    async getRegistry(organizationId) {
      return loadOrCreate(organizationId);
    },
  };
}
