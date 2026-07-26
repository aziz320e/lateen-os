/**
 * Real Agent Registry — registers/deactivates agents and tracks their
 * availability. Mirrors `@lateen-os/ai-runtime`'s AgentRegistryService
 * shape deliberately; `AgentDescriptor.runtimeAgentId` is the real
 * integration point back to that package's own registry.
 *
 * @module agent/registry.impl
 */
import type { CollaborationEventBus } from '../events/collaboration-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import { AgentNotRegisteredError } from '../shared/errors.js';
import type { AgentRegistrationRepository } from './repository.js';
import type { AgentRegistry } from './registry.js';
import type { AgentRegistration } from './types.js';

/** Creates a real {@link AgentRegistry} backed by an {@link AgentRegistrationRepository}. */
export function createAgentRegistry(repository: AgentRegistrationRepository, eventBus?: CollaborationEventBus): AgentRegistry {
  async function findByWorkerId(organizationId: string, workerId: string): Promise<AgentRegistration | null> {
    const all = await repository.findAll(organizationId);
    return all.find((registration) => registration.descriptor.workerId === workerId) ?? null;
  }

  return {
    async register(organizationId, descriptor) {
      const existing = await findByWorkerId(organizationId, descriptor.workerId);
      const now = nowIso();
      if (existing) {
        const reactivated: AgentRegistration = {
          ...existing,
          descriptor,
          active: true,
          availability: 'available',
          updatedAt: now,
          lastActiveAt: now,
        };
        await repository.save(reactivated);
        return reactivated;
      }
      const registration: AgentRegistration = {
        id: generateId('agent-registration'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        descriptor,
        availability: 'available',
        active: true,
        registeredAt: now,
        lastActiveAt: now,
      };
      await repository.save(registration);
      return registration;
    },

    async deactivate(organizationId, workerId) {
      const registration = await findByWorkerId(organizationId, workerId);
      if (!registration) throw new AgentNotRegisteredError(workerId);
      await repository.save({ ...registration, active: false, availability: 'offline', updatedAt: nowIso() });
    },

    async setAvailability(organizationId, workerId, availability) {
      const registration = await findByWorkerId(organizationId, workerId);
      if (!registration) throw new AgentNotRegisteredError(workerId);
      const updated: AgentRegistration = { ...registration, availability, updatedAt: nowIso(), lastActiveAt: nowIso() };
      await repository.save(updated);
      eventBus?.publish('agent.availability_changed', { workerId, availability });
      return updated;
    },

    async findByWorkerId(organizationId, workerId) {
      return findByWorkerId(organizationId, workerId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
