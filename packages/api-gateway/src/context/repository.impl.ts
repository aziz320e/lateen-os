/** Real, in-memory Request Context repository. @module context/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { RequestContextRepository } from './repository.js';
import type { RequestContext } from './types.js';

/** Creates a real, in-memory {@link RequestContextRepository}. */
export function createRequestContextRepository(seed?: readonly RequestContext[]): RequestContextRepository {
  const repo = createInMemoryRepository<RequestContext>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
