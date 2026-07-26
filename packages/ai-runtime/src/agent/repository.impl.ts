/** Real in-memory {@link AgentRepository} implementation. @module agent/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { RuntimeAgentId } from '../shared/identifiers.js';
import type { Agent } from './types.js';
import type { AgentRepository } from './repository.js';

export function createAgentRepository(seed?: readonly Agent[]): AgentRepository {
  const repo = createInMemoryRepository<Agent, RuntimeAgentId>({ seed });
  return {
    ...repo,
    async findByBusinessDnaAgentId(organizationId, businessDnaAgentId) {
      return repo.list(organizationId).find((agent) => agent.businessDnaAgentId === businessDnaAgentId) ?? null;
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((agent) => agent.status === status);
    },
  };
}
