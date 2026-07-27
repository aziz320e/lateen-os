/** Real, in-memory {@link WorkflowRequestRepository} implementation. @module workflow-integration/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { WorkflowRequest } from './types.js';
import type { WorkflowRequestRepository } from './repository.js';

/** Creates a real, in-memory {@link WorkflowRequestRepository}. */
export function createWorkflowRequestRepository(seed?: readonly WorkflowRequest[]): WorkflowRequestRepository {
  const repo = createInMemoryRepository<WorkflowRequest>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((request) => request.status === status);
    },
    async findByType(organizationId, requestType) {
      return repo.list(organizationId).filter((request) => request.requestType === requestType);
    },
    async findByCampaign(organizationId, campaignId) {
      return repo.list(organizationId).filter((request) => request.campaignId === campaignId);
    },
  };
}
