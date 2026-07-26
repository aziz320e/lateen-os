/**
 * Agent Directory + Agent Discovery — real, deterministic lookup over the
 * Agent Registry: browse by role/availability/capability (Directory), and
 * find the single best match for a required role (Discovery).
 *
 * @module agent/directory.impl
 */
import { NoSuitableAgentError } from '../shared/errors.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { MissionWorkerRole } from '../shared/primitives.js';
import type { AgentRegistry } from './registry.js';
import type { AgentAvailability, AgentRegistration } from './types.js';

export interface AgentDirectory {
  findByRole(organizationId: OrganizationId, role: MissionWorkerRole): Promise<readonly AgentRegistration[]>;
  findAvailable(organizationId: OrganizationId, availability?: AgentAvailability): Promise<readonly AgentRegistration[]>;
  findByCapability(organizationId: OrganizationId, capability: string): Promise<readonly AgentRegistration[]>;
}

export interface AgentDiscovery {
  /** Deterministically picks the best available agent for `role` — earliest-registered active+available match. Throws {@link NoSuitableAgentError} if none. */
  discover(organizationId: OrganizationId, role: MissionWorkerRole, requiredCapability?: string): Promise<AgentRegistration>;
}

/** Creates a real {@link AgentDirectory} over an {@link AgentRegistry}. */
export function createAgentDirectory(registry: AgentRegistry): AgentDirectory {
  return {
    async findByRole(organizationId, role) {
      const all = await registry.list(organizationId);
      return all.filter((registration) => registration.active && registration.descriptor.role === role);
    },
    async findAvailable(organizationId, availability = 'available') {
      const all = await registry.list(organizationId);
      return all.filter((registration) => registration.active && registration.availability === availability);
    },
    async findByCapability(organizationId, capability) {
      const all = await registry.list(organizationId);
      return all.filter((registration) => registration.active && registration.descriptor.capabilities.includes(capability));
    },
  };
}

/** Creates a real {@link AgentDiscovery} over an {@link AgentDirectory}. */
export function createAgentDiscovery(directory: AgentDirectory): AgentDiscovery {
  return {
    async discover(organizationId, role, requiredCapability) {
      const candidates = (await directory.findByRole(organizationId, role)).filter(
        (registration) =>
          registration.availability === 'available' &&
          (!requiredCapability || registration.descriptor.capabilities.includes(requiredCapability)),
      );
      const [best] = [...candidates].sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));
      if (!best) throw new NoSuitableAgentError(role);
      return best;
    },
  };
}
