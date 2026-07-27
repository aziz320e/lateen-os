/** Real, in-memory {@link AgentGovernanceRecordRepository} implementation. @module agent-governance/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AgentGovernanceRecordRepository } from './repository.js';
import type { AgentGovernanceRecord } from './types.js';

/** Creates a real, in-memory {@link AgentGovernanceRecordRepository}. */
export function createAgentGovernanceRecordRepository(seed?: readonly AgentGovernanceRecord[]): AgentGovernanceRecordRepository {
  const repo = createInMemoryRepository<AgentGovernanceRecord>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByRuntimeAgentId(organizationId, runtimeAgentId) {
      return repo.list(organizationId).find((record) => record.runtimeAgentId === runtimeAgentId) ?? null;
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((record) => record.status === status);
    },
  };
}
