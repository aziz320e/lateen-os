/** Real, in-memory Authorization repositories. @module authorization/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PolicyRepository, RoleAssignmentRepository, RoleRepository } from './repository.js';
import type { Policy, Role } from './types.js';

/** Creates a real, in-memory {@link RoleRepository}. */
export function createRoleRepository(seed?: readonly Role[]): RoleRepository {
  const repo = createInMemoryRepository<Role>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((role) => role.status === status);
    },
  };
}

/** Creates a real, in-memory {@link PolicyRepository}. */
export function createPolicyRepository(seed?: readonly Policy[]): PolicyRepository {
  const repo = createInMemoryRepository<Policy>({ seed });
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

function scopeKey(organizationId: string, identityId: string): string {
  return `${organizationId}::${identityId}`;
}

/** Creates a real, in-memory {@link RoleAssignmentRepository}. */
export function createRoleAssignmentRepository(): RoleAssignmentRepository {
  const store = new Map<string, Set<string>>();

  return {
    async assign(organizationId, identityId, roleId) {
      const key = scopeKey(organizationId, identityId);
      const roleIds = store.get(key) ?? new Set<string>();
      roleIds.add(roleId);
      store.set(key, roleIds);
    },
    async unassign(organizationId, identityId, roleId) {
      store.get(scopeKey(organizationId, identityId))?.delete(roleId);
    },
    async findRoleIds(organizationId, identityId) {
      return [...(store.get(scopeKey(organizationId, identityId)) ?? [])];
    },
  };
}
