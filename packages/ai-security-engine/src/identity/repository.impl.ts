/** Real, in-memory {@link IdentityRepository} implementation. @module identity/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Identity } from './types.js';
import type { IdentityRepository } from './repository.js';

/** Creates a real, in-memory {@link IdentityRepository}. */
export function createIdentityRepository(seed?: readonly Identity[]): IdentityRepository {
  const repo = createInMemoryRepository<Identity>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByType(organizationId, identityType) {
      return repo.list(organizationId).filter((identity) => identity.identityType === identityType);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((identity) => identity.status === status);
    },
    async findBySecretHash(organizationId, secretHash) {
      return repo.list(organizationId).find((identity) => identity.secretHash === secretHash) ?? null;
    },
  };
}
