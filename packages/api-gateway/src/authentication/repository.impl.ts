/** Real, in-memory API Key Registry repository. @module authentication/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ApiKeyRepository } from './repository.js';
import type { ApiKey } from './types.js';

/** Creates a real, in-memory {@link ApiKeyRepository}. */
export function createApiKeyRepository(seed?: readonly ApiKey[]): ApiKeyRepository {
  const repo = createInMemoryRepository<ApiKey>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByHash(organizationId, keyHash) {
      return repo.list(organizationId).find((apiKey) => apiKey.keyHash === keyHash) ?? null;
    },
  };
}
