/** Real in-memory {@link AgentRegistryRepository} implementation. @module registry/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { OrganizationId } from '../shared/identifiers.js';
import type { AgentRegistry } from './types.js';
import type { AgentRegistryRepository } from './repository.js';

export function createAgentRegistryRepository(seed?: readonly AgentRegistry[]): AgentRegistryRepository {
  const repo = createInMemoryRepository<AgentRegistry, OrganizationId>({ seed });
  return {
    ...repo,
    async findByBusinessDnaAgentId(organizationId, businessDnaAgentId) {
      const registry = await repo.findById(organizationId, organizationId);
      if (!registry) return null;
      const hasMatch = registry.registrations.some(
        (registration) => registration.descriptor.businessDnaAgentId === businessDnaAgentId,
      );
      return hasMatch ? registry : null;
    },
  };
}
