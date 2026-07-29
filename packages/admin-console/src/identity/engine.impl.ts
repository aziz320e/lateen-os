/**
 * Real Identity Administration engine — Users, Groups, Roles, and
 * Permissions. This engine only administers organizational RBAC
 * bookkeeping; it never verifies a password or token and never
 * implements an authentication pipeline — see
 * `relationship-management`'s `getSecurityIdentityContext()` for the
 * real, composed link to AI Security Engine, which owns
 * authentication.
 *
 * @module identity/engine.impl
 */
import type { AdminEventBus } from '../events/admin-event-bus.js';
import { GroupNotFoundError, PermissionNotFoundError, RoleNotFoundError, UnknownPermissionCodeError, UserNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { GroupId, OrganizationId, PermissionId, RoleId, UserId } from '../shared/identifiers.js';
import type { GroupRepository, PermissionRepository, RoleRepository, UserRepository } from './repository.js';
import type { Group, Permission, Role, User } from './types.js';

export interface CreatePermissionInput {
  readonly code: string;
  readonly description?: string;
}

export interface CreateRoleInput {
  readonly name: string;
  readonly permissionCodes?: readonly string[];
}

export interface CreateGroupInput {
  readonly name: string;
}

export interface CreateUserInput {
  readonly email: string;
  readonly displayName: string;
}

export interface IdentityAdministrationEngine {
  createPermission(organizationId: OrganizationId, input: CreatePermissionInput): Promise<Permission>;
  archivePermission(organizationId: OrganizationId, permissionId: PermissionId): Promise<Permission>;
  getPermission(organizationId: OrganizationId, permissionId: PermissionId): Promise<Permission | null>;
  listPermissions(organizationId: OrganizationId): Promise<readonly Permission[]>;

  createRole(organizationId: OrganizationId, input: CreateRoleInput): Promise<Role>;
  addPermissionToRole(organizationId: OrganizationId, roleId: RoleId, code: string): Promise<Role>;
  removePermissionFromRole(organizationId: OrganizationId, roleId: RoleId, code: string): Promise<Role>;
  archiveRole(organizationId: OrganizationId, roleId: RoleId): Promise<Role>;
  getRole(organizationId: OrganizationId, roleId: RoleId): Promise<Role | null>;
  listRoles(organizationId: OrganizationId): Promise<readonly Role[]>;

  createGroup(organizationId: OrganizationId, input: CreateGroupInput): Promise<Group>;
  addMember(organizationId: OrganizationId, groupId: GroupId, userId: UserId): Promise<Group>;
  removeMember(organizationId: OrganizationId, groupId: GroupId, userId: UserId): Promise<Group>;
  archiveGroup(organizationId: OrganizationId, groupId: GroupId): Promise<Group>;
  getGroup(organizationId: OrganizationId, groupId: GroupId): Promise<Group | null>;
  listGroups(organizationId: OrganizationId): Promise<readonly Group[]>;

  createUser(organizationId: OrganizationId, input: CreateUserInput): Promise<User>;
  assignRole(organizationId: OrganizationId, userId: UserId, roleId: RoleId): Promise<User>;
  unassignRole(organizationId: OrganizationId, userId: UserId, roleId: RoleId): Promise<User>;
  suspendUser(organizationId: OrganizationId, userId: UserId): Promise<User>;
  reactivateUser(organizationId: OrganizationId, userId: UserId): Promise<User>;
  deactivateUser(organizationId: OrganizationId, userId: UserId): Promise<User>;
  getUser(organizationId: OrganizationId, userId: UserId): Promise<User | null>;
  findUserByEmail(organizationId: OrganizationId, email: string): Promise<User | null>;
  listUsers(organizationId: OrganizationId): Promise<readonly User[]>;
}

/** Creates a real {@link IdentityAdministrationEngine}. */
export function createIdentityAdministrationEngine(
  permissionRepository: PermissionRepository,
  roleRepository: RoleRepository,
  groupRepository: GroupRepository,
  userRepository: UserRepository,
  eventBus?: AdminEventBus,
  now: () => string = nowIso,
): IdentityAdministrationEngine {
  async function requirePermission(organizationId: OrganizationId, permissionId: PermissionId): Promise<Permission> {
    const permission = await permissionRepository.findById(organizationId, permissionId);
    if (!permission) throw new PermissionNotFoundError(permissionId);
    return permission;
  }

  async function requireRole(organizationId: OrganizationId, roleId: RoleId): Promise<Role> {
    const role = await roleRepository.findById(organizationId, roleId);
    if (!role) throw new RoleNotFoundError(roleId);
    return role;
  }

  async function requireGroup(organizationId: OrganizationId, groupId: GroupId): Promise<Group> {
    const group = await groupRepository.findById(organizationId, groupId);
    if (!group) throw new GroupNotFoundError(groupId);
    return group;
  }

  async function requireUser(organizationId: OrganizationId, userId: UserId): Promise<User> {
    const user = await userRepository.findById(organizationId, userId);
    if (!user) throw new UserNotFoundError(userId);
    return user;
  }

  async function requireKnownPermissionCodes(organizationId: OrganizationId, codes: readonly string[]): Promise<void> {
    for (const code of codes) {
      const permission = await permissionRepository.findByCode(organizationId, code);
      if (!permission) throw new UnknownPermissionCodeError(code);
    }
  }

  return {
    async createPermission(organizationId, input) {
      const timestamp = now();
      const permission: Permission = {
        id: generateId('admin-permission'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        code: input.code,
        description: input.description,
        status: 'active',
      };
      await permissionRepository.save(permission);
      return permission;
    },

    async archivePermission(organizationId, permissionId) {
      const permission = await requirePermission(organizationId, permissionId);
      const updated: Permission = { ...permission, status: 'archived', updatedAt: now() };
      await permissionRepository.save(updated);
      return updated;
    },

    async getPermission(organizationId, permissionId) {
      return permissionRepository.findById(organizationId, permissionId);
    },

    async listPermissions(organizationId) {
      return permissionRepository.findAll(organizationId);
    },

    async createRole(organizationId, input) {
      const permissionCodes = input.permissionCodes ?? [];
      await requireKnownPermissionCodes(organizationId, permissionCodes);
      const timestamp = now();
      const role: Role = {
        id: generateId('admin-role'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        permissionCodes,
        status: 'active',
      };
      await roleRepository.save(role);
      eventBus?.publish('role.created', { organizationId, roleId: role.id, name: role.name });
      return role;
    },

    async addPermissionToRole(organizationId, roleId, code) {
      const role = await requireRole(organizationId, roleId);
      await requireKnownPermissionCodes(organizationId, [code]);
      if (role.permissionCodes.includes(code)) return role;
      const updated: Role = { ...role, permissionCodes: [...role.permissionCodes, code], updatedAt: now() };
      await roleRepository.save(updated);
      return updated;
    },

    async removePermissionFromRole(organizationId, roleId, code) {
      const role = await requireRole(organizationId, roleId);
      const updated: Role = { ...role, permissionCodes: role.permissionCodes.filter((existing) => existing !== code), updatedAt: now() };
      await roleRepository.save(updated);
      return updated;
    },

    async archiveRole(organizationId, roleId) {
      const role = await requireRole(organizationId, roleId);
      const updated: Role = { ...role, status: 'archived', updatedAt: now() };
      await roleRepository.save(updated);
      return updated;
    },

    async getRole(organizationId, roleId) {
      return roleRepository.findById(organizationId, roleId);
    },

    async listRoles(organizationId) {
      return roleRepository.findAll(organizationId);
    },

    async createGroup(organizationId, input) {
      const timestamp = now();
      const group: Group = {
        id: generateId('admin-group'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        memberUserIds: [],
        status: 'active',
      };
      await groupRepository.save(group);
      return group;
    },

    async addMember(organizationId, groupId, userId) {
      const group = await requireGroup(organizationId, groupId);
      await requireUser(organizationId, userId);
      if (group.memberUserIds.includes(userId)) return group;
      const updated: Group = { ...group, memberUserIds: [...group.memberUserIds, userId], updatedAt: now() };
      await groupRepository.save(updated);
      return updated;
    },

    async removeMember(organizationId, groupId, userId) {
      const group = await requireGroup(organizationId, groupId);
      const updated: Group = { ...group, memberUserIds: group.memberUserIds.filter((existing) => existing !== userId), updatedAt: now() };
      await groupRepository.save(updated);
      return updated;
    },

    async archiveGroup(organizationId, groupId) {
      const group = await requireGroup(organizationId, groupId);
      const updated: Group = { ...group, status: 'archived', updatedAt: now() };
      await groupRepository.save(updated);
      return updated;
    },

    async getGroup(organizationId, groupId) {
      return groupRepository.findById(organizationId, groupId);
    },

    async listGroups(organizationId) {
      return groupRepository.findAll(organizationId);
    },

    async createUser(organizationId, input) {
      const timestamp = now();
      const user: User = {
        id: generateId('admin-user'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        email: input.email,
        displayName: input.displayName,
        roleIds: [],
        status: 'active',
      };
      await userRepository.save(user);
      eventBus?.publish('user.created', { organizationId, userId: user.id, email: user.email });
      return user;
    },

    async assignRole(organizationId, userId, roleId) {
      const user = await requireUser(organizationId, userId);
      await requireRole(organizationId, roleId);
      if (user.roleIds.includes(roleId)) return user;
      const updated: User = { ...user, roleIds: [...user.roleIds, roleId], updatedAt: now() };
      await userRepository.save(updated);
      return updated;
    },

    async unassignRole(organizationId, userId, roleId) {
      const user = await requireUser(organizationId, userId);
      const updated: User = { ...user, roleIds: user.roleIds.filter((existing) => existing !== roleId), updatedAt: now() };
      await userRepository.save(updated);
      return updated;
    },

    async suspendUser(organizationId, userId) {
      const user = await requireUser(organizationId, userId);
      const updated: User = { ...user, status: 'suspended', updatedAt: now() };
      await userRepository.save(updated);
      return updated;
    },

    async reactivateUser(organizationId, userId) {
      const user = await requireUser(organizationId, userId);
      const updated: User = { ...user, status: 'active', updatedAt: now() };
      await userRepository.save(updated);
      return updated;
    },

    async deactivateUser(organizationId, userId) {
      const user = await requireUser(organizationId, userId);
      const updated: User = { ...user, status: 'deactivated', updatedAt: now() };
      await userRepository.save(updated);
      return updated;
    },

    async getUser(organizationId, userId) {
      return userRepository.findById(organizationId, userId);
    },

    async findUserByEmail(organizationId, email) {
      return userRepository.findByEmail(organizationId, email);
    },

    async listUsers(organizationId) {
      return userRepository.findAll(organizationId);
    },
  };
}
