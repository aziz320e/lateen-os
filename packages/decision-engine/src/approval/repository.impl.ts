/** Real in-memory {@link ApprovalFlowRepository} implementation. @module approval/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ApprovalFlowId } from '../shared/identifiers.js';
import type { ApprovalFlow } from './types.js';
import type { ApprovalFlowRepository } from './repository.js';

export function createApprovalFlowRepository(seed?: readonly ApprovalFlow[]): ApprovalFlowRepository {
  const repo = createInMemoryRepository<ApprovalFlow, ApprovalFlowId>({ seed });
  return {
    ...repo,
    async findByDecision(organizationId, decisionId) {
      return repo.list(organizationId).find((flow) => flow.decisionId === decisionId) ?? null;
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((flow) => flow.status === status);
    },
  };
}
