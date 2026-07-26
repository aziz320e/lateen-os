/** Real in-memory {@link AgentRegistrationRepository} / {@link AgentGroupRepository} implementations. @module agent/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AgentGroup, AgentRegistration } from './types.js';
import type { AgentGroupRepository, AgentRegistrationRepository } from './repository.js';

export function createAgentRegistrationRepository(seed?: readonly AgentRegistration[]): AgentRegistrationRepository {
  const repo = createInMemoryRepository<AgentRegistration>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

export function createAgentGroupRepository(seed?: readonly AgentGroup[]): AgentGroupRepository {
  const repo = createInMemoryRepository<AgentGroup>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
