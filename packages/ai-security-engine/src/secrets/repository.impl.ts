/** Real, in-memory {@link SecretRepository} implementation. @module secrets/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Secret } from './types.js';
import type { SecretRepository } from './repository.js';

/** Creates a real, in-memory {@link SecretRepository}. */
export function createSecretRepository(seed?: readonly Secret[]): SecretRepository {
  const repo = createInMemoryRepository<Secret>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByType(organizationId, secretType) {
      return repo.list(organizationId).filter((secret) => secret.secretType === secretType);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((secret) => secret.status === status);
    },
  };
}
