/** Real, in-memory Human Approval Engine repositories. @module approval/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ApprovalRequestRepository, GovernanceExceptionRepository } from './repository.js';
import type { ApprovalRequest, GovernanceException } from './types.js';

/** Creates a real, in-memory {@link ApprovalRequestRepository}. */
export function createApprovalRequestRepository(seed?: readonly ApprovalRequest[]): ApprovalRequestRepository {
  const repo = createInMemoryRepository<ApprovalRequest>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCategory(organizationId, category) {
      return repo.list(organizationId).filter((request) => request.category === category);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((request) => request.status === status);
    },
  };
}

/** Creates a real, in-memory {@link GovernanceExceptionRepository}. */
export function createGovernanceExceptionRepository(seed?: readonly GovernanceException[]): GovernanceExceptionRepository {
  const repo = createInMemoryRepository<GovernanceException>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByApprovalRequestId(organizationId, approvalRequestId) {
      return repo.list(organizationId).find((exception) => exception.approvalRequestId === approvalRequestId) ?? null;
    },
  };
}
