/** Real in-memory {@link RuntimeSessionRepository} implementation. @module runtime/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { RuntimeSessionId } from '../shared/identifiers.js';
import type { RuntimeSession } from './types.js';
import type { RuntimeSessionRepository } from './repository.js';

export function createRuntimeSessionRepository(seed?: readonly RuntimeSession[]): RuntimeSessionRepository {
  const repo = createInMemoryRepository<RuntimeSession, RuntimeSessionId>({ seed });
  return {
    ...repo,
    async findByAgent(organizationId, runtimeAgentId) {
      return repo.list(organizationId).filter((session) => session.runtimeAgentId === runtimeAgentId);
    },
    async findActiveByAgent(organizationId, runtimeAgentId) {
      return (
        repo
          .list(organizationId)
          .find((session) => session.runtimeAgentId === runtimeAgentId && !session.endedAt) ?? null
      );
    },
    async findByState(organizationId, state) {
      return repo.list(organizationId).filter((session) => session.state === state);
    },
  };
}
