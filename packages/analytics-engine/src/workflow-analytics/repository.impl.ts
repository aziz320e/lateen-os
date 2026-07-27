/** Real, in-memory {@link WorkflowAnalyticsRepository} implementation. @module workflow-analytics/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { WorkflowAnalyticsRepository } from './repository.js';
import type { WorkflowAnalyticsSnapshot } from './types.js';

/** Creates a real, in-memory {@link WorkflowAnalyticsRepository}. */
export function createWorkflowAnalyticsRepository(seed?: readonly WorkflowAnalyticsSnapshot[]): WorkflowAnalyticsRepository {
  const repo = createInMemoryRepository<WorkflowAnalyticsSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
