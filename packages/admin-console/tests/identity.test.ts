import { describe, expect, it } from 'vitest';
import { createAdminEventBus } from '../src/events/index.js';
import { createIdentityAdministrationEngine } from '../src/identity/engine.impl.js';
import { createGroupRepository, createPermissionRepository, createRoleRepository, createUserRepository } from '../src/identity/repository.impl.js';
import { GroupNotFoundError, PermissionNotFoundError, RoleNotFoundError, UnknownPermissionCodeError, UserNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createAdminEventBus();
  const engine = createIdentityAdministrationEngine(createPermissionRepository(), createRoleRepository(), createGroupRepository(), createUserRepository(), eventBus);
  return { engine, eventBus };
}

describe('IdentityAdministrationEngine — Permissions', () => {
  it('createPermission() starts at active status', async () => {
    const { engine } = setup();
    const permission = await engine.createPermission(ORG, { code: 'billing:read' });
    expect(permission.status).toBe('active');
  });

  it('archivePermission() moves to archived status', async () => {
    const { engine } = setup();
    const permission = await engine.createPermission(ORG, { code: 'billing:read' });
    const archived = await engine.archivePermission(ORG, permission.id);
    expect(archived.status).toBe('archived');
  });

  it('archivePermission() throws PermissionNotFoundError for an unknown permission', async () => {
    const { engine } = setup();
    await expect(engine.archivePermission(ORG, 'missing')).rejects.toBeInstanceOf(PermissionNotFoundError);
  });

  it('getPermission()/listPermissions() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getPermission(ORG, 'missing')).toBeNull();
    const permission = await engine.createPermission(ORG, { code: 'billing:read' });
    expect(await engine.getPermission(ORG, permission.id)).toEqual(permission);
    expect(await engine.listPermissions(ORG)).toHaveLength(1);
  });

  it('createPermission() accepts an optional description', async () => {
    const { engine } = setup();
    const permission = await engine.createPermission(ORG, { code: 'billing:read', description: 'Read billing records' });
    expect(permission.description).toBe('Read billing records');
  });

  it('permissions are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createPermission(ORG, { code: 'billing:read' });
    await engine.createPermission('org-2', { code: 'billing:read' });
    expect(await engine.listPermissions(ORG)).toHaveLength(1);
    expect(await engine.listPermissions('org-2')).toHaveLength(1);
  });
});

describe('IdentityAdministrationEngine — Roles', () => {
  it('createRole() starts at active status with an empty permission list by default', async () => {
    const { engine } = setup();
    const role = await engine.createRole(ORG, { name: 'Viewer' });
    expect(role.status).toBe('active');
    expect(role.permissionCodes).toEqual([]);
  });

  it('publishes role.created', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('role.created', (payload) => (seen = payload));
    const role = await engine.createRole(ORG, { name: 'Viewer' });
    expect(seen).toEqual({ organizationId: ORG, roleId: role.id, name: 'Viewer' });
  });

  it('createRole() accepts known permission codes', async () => {
    const { engine } = setup();
    await engine.createPermission(ORG, { code: 'billing:read' });
    const role = await engine.createRole(ORG, { name: 'Billing Viewer', permissionCodes: ['billing:read'] });
    expect(role.permissionCodes).toEqual(['billing:read']);
  });

  it('createRole() throws UnknownPermissionCodeError for an unregistered permission code', async () => {
    const { engine } = setup();
    await expect(engine.createRole(ORG, { name: 'Billing Viewer', permissionCodes: ['billing:read'] })).rejects.toBeInstanceOf(UnknownPermissionCodeError);
  });

  it('addPermissionToRole() appends a known permission code, idempotently', async () => {
    const { engine } = setup();
    await engine.createPermission(ORG, { code: 'billing:read' });
    const role = await engine.createRole(ORG, { name: 'Viewer' });
    const updated = await engine.addPermissionToRole(ORG, role.id, 'billing:read');
    expect(updated.permissionCodes).toEqual(['billing:read']);
    const again = await engine.addPermissionToRole(ORG, role.id, 'billing:read');
    expect(again.permissionCodes).toEqual(['billing:read']);
  });

  it('addPermissionToRole() throws UnknownPermissionCodeError for an unregistered code', async () => {
    const { engine } = setup();
    const role = await engine.createRole(ORG, { name: 'Viewer' });
    await expect(engine.addPermissionToRole(ORG, role.id, 'unknown:code')).rejects.toBeInstanceOf(UnknownPermissionCodeError);
  });

  it('addPermissionToRole() throws RoleNotFoundError for an unknown role', async () => {
    const { engine } = setup();
    await engine.createPermission(ORG, { code: 'billing:read' });
    await expect(engine.addPermissionToRole(ORG, 'missing', 'billing:read')).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it('removePermissionFromRole() removes a code, leaving others intact', async () => {
    const { engine } = setup();
    await engine.createPermission(ORG, { code: 'billing:read' });
    await engine.createPermission(ORG, { code: 'billing:write' });
    const role = await engine.createRole(ORG, { name: 'Billing Admin', permissionCodes: ['billing:read', 'billing:write'] });
    const updated = await engine.removePermissionFromRole(ORG, role.id, 'billing:write');
    expect(updated.permissionCodes).toEqual(['billing:read']);
  });

  it('archiveRole() moves to archived status', async () => {
    const { engine } = setup();
    const role = await engine.createRole(ORG, { name: 'Viewer' });
    const archived = await engine.archiveRole(ORG, role.id);
    expect(archived.status).toBe('archived');
  });

  it('archiveRole() throws RoleNotFoundError for an unknown role', async () => {
    const { engine } = setup();
    await expect(engine.archiveRole(ORG, 'missing')).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it('getRole()/listRoles() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getRole(ORG, 'missing')).toBeNull();
    const role = await engine.createRole(ORG, { name: 'Viewer' });
    expect(await engine.getRole(ORG, role.id)).toEqual(role);
    expect(await engine.listRoles(ORG)).toHaveLength(1);
  });

  it('roles are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createRole(ORG, { name: 'Viewer' });
    await engine.createRole('org-2', { name: 'Viewer' });
    expect(await engine.listRoles(ORG)).toHaveLength(1);
    expect(await engine.listRoles('org-2')).toHaveLength(1);
  });
});

describe('IdentityAdministrationEngine — Groups', () => {
  it('createGroup() starts at active status with no members', async () => {
    const { engine } = setup();
    const group = await engine.createGroup(ORG, { name: 'Engineering' });
    expect(group.status).toBe('active');
    expect(group.memberUserIds).toEqual([]);
  });

  it('addMember() adds a real user, idempotently', async () => {
    const { engine } = setup();
    const group = await engine.createGroup(ORG, { name: 'Engineering' });
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    const updated = await engine.addMember(ORG, group.id, user.id);
    expect(updated.memberUserIds).toEqual([user.id]);
    const again = await engine.addMember(ORG, group.id, user.id);
    expect(again.memberUserIds).toEqual([user.id]);
  });

  it('addMember() throws UserNotFoundError for an unknown user', async () => {
    const { engine } = setup();
    const group = await engine.createGroup(ORG, { name: 'Engineering' });
    await expect(engine.addMember(ORG, group.id, 'missing')).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('addMember() throws GroupNotFoundError for an unknown group', async () => {
    const { engine } = setup();
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    await expect(engine.addMember(ORG, 'missing', user.id)).rejects.toBeInstanceOf(GroupNotFoundError);
  });

  it('removeMember() removes a member', async () => {
    const { engine } = setup();
    const group = await engine.createGroup(ORG, { name: 'Engineering' });
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    await engine.addMember(ORG, group.id, user.id);
    const updated = await engine.removeMember(ORG, group.id, user.id);
    expect(updated.memberUserIds).toEqual([]);
  });

  it('archiveGroup() moves to archived status', async () => {
    const { engine } = setup();
    const group = await engine.createGroup(ORG, { name: 'Engineering' });
    const archived = await engine.archiveGroup(ORG, group.id);
    expect(archived.status).toBe('archived');
  });

  it('archiveGroup() throws GroupNotFoundError for an unknown group', async () => {
    const { engine } = setup();
    await expect(engine.archiveGroup(ORG, 'missing')).rejects.toBeInstanceOf(GroupNotFoundError);
  });

  it('getGroup()/listGroups() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getGroup(ORG, 'missing')).toBeNull();
    const group = await engine.createGroup(ORG, { name: 'Engineering' });
    expect(await engine.getGroup(ORG, group.id)).toEqual(group);
    expect(await engine.listGroups(ORG)).toHaveLength(1);
  });

  it('groups are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createGroup(ORG, { name: 'Engineering' });
    await engine.createGroup('org-2', { name: 'Engineering' });
    expect(await engine.listGroups(ORG)).toHaveLength(1);
    expect(await engine.listGroups('org-2')).toHaveLength(1);
  });
});

describe('IdentityAdministrationEngine — Users', () => {
  it('createUser() starts at active status with no roles', async () => {
    const { engine } = setup();
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    expect(user.status).toBe('active');
    expect(user.roleIds).toEqual([]);
  });

  it('publishes user.created', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('user.created', (payload) => (seen = payload));
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    expect(seen).toEqual({ organizationId: ORG, userId: user.id, email: 'a@b.com' });
  });

  it('assignRole() adds a real role, idempotently', async () => {
    const { engine } = setup();
    const role = await engine.createRole(ORG, { name: 'Viewer' });
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    const updated = await engine.assignRole(ORG, user.id, role.id);
    expect(updated.roleIds).toEqual([role.id]);
    const again = await engine.assignRole(ORG, user.id, role.id);
    expect(again.roleIds).toEqual([role.id]);
  });

  it('assignRole() throws RoleNotFoundError for an unknown role', async () => {
    const { engine } = setup();
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    await expect(engine.assignRole(ORG, user.id, 'missing')).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it('assignRole() throws UserNotFoundError for an unknown user', async () => {
    const { engine } = setup();
    const role = await engine.createRole(ORG, { name: 'Viewer' });
    await expect(engine.assignRole(ORG, 'missing', role.id)).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('unassignRole() removes a role', async () => {
    const { engine } = setup();
    const role = await engine.createRole(ORG, { name: 'Viewer' });
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    await engine.assignRole(ORG, user.id, role.id);
    const updated = await engine.unassignRole(ORG, user.id, role.id);
    expect(updated.roleIds).toEqual([]);
  });

  it('suspendUser() / reactivateUser() toggle status', async () => {
    const { engine } = setup();
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    const suspended = await engine.suspendUser(ORG, user.id);
    expect(suspended.status).toBe('suspended');
    const reactivated = await engine.reactivateUser(ORG, user.id);
    expect(reactivated.status).toBe('active');
  });

  it('deactivateUser() moves to deactivated status', async () => {
    const { engine } = setup();
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    const deactivated = await engine.deactivateUser(ORG, user.id);
    expect(deactivated.status).toBe('deactivated');
  });

  it('suspendUser() throws UserNotFoundError for an unknown user', async () => {
    const { engine } = setup();
    await expect(engine.suspendUser(ORG, 'missing')).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('getUser()/findUserByEmail()/listUsers() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getUser(ORG, 'missing')).toBeNull();
    expect(await engine.findUserByEmail(ORG, 'missing@b.com')).toBeNull();
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    expect(await engine.getUser(ORG, user.id)).toEqual(user);
    expect(await engine.findUserByEmail(ORG, 'a@b.com')).toEqual(user);
    expect(await engine.listUsers(ORG)).toHaveLength(1);
  });

  it('users are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    await engine.createUser('org-2', { email: 'a@b.com', displayName: 'A B' });
    expect(await engine.listUsers(ORG)).toHaveLength(1);
    expect(await engine.listUsers('org-2')).toHaveLength(1);
  });

  it('a user can be assigned multiple distinct roles', async () => {
    const { engine } = setup();
    const roleA = await engine.createRole(ORG, { name: 'Viewer' });
    const roleB = await engine.createRole(ORG, { name: 'Editor' });
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    await engine.assignRole(ORG, user.id, roleA.id);
    const updated = await engine.assignRole(ORG, user.id, roleB.id);
    expect(updated.roleIds).toEqual([roleA.id, roleB.id]);
  });

  it('unassignRole() on a role the user never had leaves roleIds unchanged', async () => {
    const { engine } = setup();
    const role = await engine.createRole(ORG, { name: 'Viewer' });
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    const updated = await engine.unassignRole(ORG, user.id, role.id);
    expect(updated.roleIds).toEqual([]);
  });

  it('deactivateUser() throws UserNotFoundError for an unknown user', async () => {
    const { engine } = setup();
    await expect(engine.deactivateUser(ORG, 'missing')).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('unassignRole() throws UserNotFoundError for an unknown user', async () => {
    const { engine } = setup();
    const role = await engine.createRole(ORG, { name: 'Viewer' });
    await expect(engine.unassignRole(ORG, 'missing', role.id)).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('removeMember() on a group without that member leaves memberUserIds unchanged', async () => {
    const { engine } = setup();
    const group = await engine.createGroup(ORG, { name: 'Engineering' });
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    const updated = await engine.removeMember(ORG, group.id, user.id);
    expect(updated.memberUserIds).toEqual([]);
  });

  it('removeMember() throws GroupNotFoundError for an unknown group', async () => {
    const { engine } = setup();
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    await expect(engine.removeMember(ORG, 'missing', user.id)).rejects.toBeInstanceOf(GroupNotFoundError);
  });

  it('removePermissionFromRole() throws RoleNotFoundError for an unknown role', async () => {
    const { engine } = setup();
    await expect(engine.removePermissionFromRole(ORG, 'missing', 'billing:read')).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it('removePermissionFromRole() on a role that never had the code leaves permissionCodes unchanged', async () => {
    const { engine } = setup();
    await engine.createPermission(ORG, { code: 'billing:read' });
    const role = await engine.createRole(ORG, { name: 'Viewer', permissionCodes: ['billing:read'] });
    const updated = await engine.removePermissionFromRole(ORG, role.id, 'unrelated:code');
    expect(updated.permissionCodes).toEqual(['billing:read']);
  });

  it('a group can have multiple distinct members', async () => {
    const { engine } = setup();
    const group = await engine.createGroup(ORG, { name: 'Engineering' });
    const userA = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    const userB = await engine.createUser(ORG, { email: 'c@b.com', displayName: 'C B' });
    await engine.addMember(ORG, group.id, userA.id);
    const updated = await engine.addMember(ORG, group.id, userB.id);
    expect(updated.memberUserIds).toEqual([userA.id, userB.id]);
  });

  it('createRole() with no permissionCodes at all still succeeds', async () => {
    const { engine } = setup();
    const role = await engine.createRole(ORG, { name: 'Empty Role' });
    expect(role.permissionCodes).toEqual([]);
  });

  it('archived permissions are still returned by getPermission() and listPermissions()', async () => {
    const { engine } = setup();
    const permission = await engine.createPermission(ORG, { code: 'billing:read' });
    await engine.archivePermission(ORG, permission.id);
    expect((await engine.getPermission(ORG, permission.id))?.status).toBe('archived');
    expect(await engine.listPermissions(ORG)).toHaveLength(1);
  });

  it('findUserByEmail() is case-sensitive and exact-match only', async () => {
    const { engine } = setup();
    await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    expect(await engine.findUserByEmail(ORG, 'A@B.COM')).toBeNull();
  });

  it('archiveGroup() does not clear existing members', async () => {
    const { engine } = setup();
    const group = await engine.createGroup(ORG, { name: 'Engineering' });
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    await engine.addMember(ORG, group.id, user.id);
    const archived = await engine.archiveGroup(ORG, group.id);
    expect(archived.memberUserIds).toEqual([user.id]);
  });

  it('addPermissionToRole() on an archived role still succeeds — archiving does not lock the aggregate', async () => {
    const { engine } = setup();
    await engine.createPermission(ORG, { code: 'billing:read' });
    const role = await engine.createRole(ORG, { name: 'Viewer' });
    await engine.archiveRole(ORG, role.id);
    const updated = await engine.addPermissionToRole(ORG, role.id, 'billing:read');
    expect(updated.permissionCodes).toEqual(['billing:read']);
  });

  it('createRole() accepts multiple known permission codes at once', async () => {
    const { engine } = setup();
    await engine.createPermission(ORG, { code: 'billing:read' });
    await engine.createPermission(ORG, { code: 'billing:write' });
    const role = await engine.createRole(ORG, { name: 'Billing Admin', permissionCodes: ['billing:read', 'billing:write'] });
    expect(role.permissionCodes).toEqual(['billing:read', 'billing:write']);
  });

  it('suspendUser() followed by deactivateUser() ends in deactivated, not suspended', async () => {
    const { engine } = setup();
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    await engine.suspendUser(ORG, user.id);
    const deactivated = await engine.deactivateUser(ORG, user.id);
    expect(deactivated.status).toBe('deactivated');
  });

  it('two users with different emails in the same organization are both independently retrievable', async () => {
    const { engine } = setup();
    const userA = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A' });
    const userB = await engine.createUser(ORG, { email: 'c@b.com', displayName: 'C' });
    expect(await engine.getUser(ORG, userA.id)).toEqual(userA);
    expect(await engine.getUser(ORG, userB.id)).toEqual(userB);
  });

  it('createGroup() names are not required to be unique', async () => {
    const { engine } = setup();
    const first = await engine.createGroup(ORG, { name: 'Same Name' });
    const second = await engine.createGroup(ORG, { name: 'Same Name' });
    expect(first.id).not.toBe(second.id);
  });

  it('assignRole() throws RoleNotFoundError when the role belongs to a different organization', async () => {
    const { engine } = setup();
    const role = await engine.createRole('org-2', { name: 'Viewer' });
    const user = await engine.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    await expect(engine.assignRole(ORG, user.id, role.id)).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it('addMember() throws UserNotFoundError when the user belongs to a different organization', async () => {
    const { engine } = setup();
    const group = await engine.createGroup(ORG, { name: 'Engineering' });
    const user = await engine.createUser('org-2', { email: 'a@b.com', displayName: 'A B' });
    await expect(engine.addMember(ORG, group.id, user.id)).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('createPermission() codes are not required to be unique across organizations', async () => {
    const { engine } = setup();
    const permissionA = await engine.createPermission(ORG, { code: 'billing:read' });
    const permissionB = await engine.createPermission('org-2', { code: 'billing:read' });
    expect(permissionA.id).not.toBe(permissionB.id);
  });
});
