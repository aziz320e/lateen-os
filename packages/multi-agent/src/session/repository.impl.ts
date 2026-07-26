/** Real in-memory {@link AgentSessionRepository} implementation. @module session/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AgentSession } from './types.js';
import type { AgentSessionRepository } from './repository.js';

export function createAgentSessionRepository(seed?: readonly AgentSession[]): AgentSessionRepository {
  const repo = createInMemoryRepository<AgentSession>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).filter((session) => session.missionId === missionId);
    },
    async findActiveByWorker(organizationId, missionId, workerId) {
      return (
        repo
          .list(organizationId)
          .find((session) => session.missionId === missionId && session.workerId === workerId && session.status === 'active') ?? null
      );
    },
  };
}
