/** Real, in-memory Identity Administration repositories. @module identity/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { GroupRepository, PermissionRepository, RoleRepository, UserRepository } from './repository.js';
import type { Group, Permission, Role, User } from './types.js';

/** Creates a real, in-memory {@link PermissionRepository}. */
export function createPermissionRepository(seed?: readonly Permission[]): PermissionRepository {
  const repo = createInMemoryRepository<Permission>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((permission) => permission.code === code) ?? null;
    },
  };
}

/** Creates a real, in-memory {@link RoleRepository}. */
export function createRoleRepository(seed?: readonly Role[]): RoleRepository {
  const repo = createInMemoryRepository<Role>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link GroupRepository}. */
export function createGroupRepository(seed?: readonly Group[]): GroupRepository {
  const repo = createInMemoryRepository<Group>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link UserRepository}. */
export function createUserRepository(seed?: readonly User[]): UserRepository {
  const repo = createInMemoryRepository<User>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByEmail(organizationId, email) {
      return repo.list(organizationId).find((user) => user.email === email) ?? null;
    },
  };
}
