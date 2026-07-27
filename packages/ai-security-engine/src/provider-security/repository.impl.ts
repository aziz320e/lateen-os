/** Real, in-memory {@link ProviderSecurityPolicyRepository} implementation. @module provider-security/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ProviderSecurityPolicy } from './types.js';
import type { ProviderSecurityPolicyRepository } from './repository.js';

/** Creates a real, in-memory {@link ProviderSecurityPolicyRepository}. */
export function createProviderSecurityPolicyRepository(seed?: readonly ProviderSecurityPolicy[]): ProviderSecurityPolicyRepository {
  const repo = createInMemoryRepository<ProviderSecurityPolicy>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((policy) => policy.status === status);
    },
  };
}
