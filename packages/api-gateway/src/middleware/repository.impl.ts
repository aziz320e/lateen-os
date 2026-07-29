/** Real, in-memory Middleware Pipeline repository. @module middleware/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { MiddlewareStepRepository } from './repository.js';
import type { MiddlewareStep } from './types.js';

/** Creates a real, in-memory {@link MiddlewareStepRepository}. */
export function createMiddlewareStepRepository(seed?: readonly MiddlewareStep[]): MiddlewareStepRepository {
  const repo = createInMemoryRepository<MiddlewareStep>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
