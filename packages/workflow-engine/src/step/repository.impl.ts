/** Real in-memory {@link StepInstanceRepository} implementation. @module step/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { StepInstance } from './types.js';
import type { StepInstanceRepository } from './repository.js';

export function createStepInstanceRepository(seed?: readonly StepInstance[]): StepInstanceRepository {
  const repo = createInMemoryRepository<StepInstance>({ seed });
  return {
    ...repo,
    async findByInstanceId(organizationId, instanceId) {
      return repo.list(organizationId).filter((stepInstance) => stepInstance.instanceId === instanceId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((stepInstance) => stepInstance.status === status);
    },
  };
}
