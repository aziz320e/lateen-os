import { describe, expect, it, vi } from 'vitest';
import { createRoleRepository, createPolicyRepository, createRoleAssignmentRepository } from '../src/authorization/repository.impl.js';
import { createAuthorizationService } from '../src/authorization/service.impl.js';
import { createAuditEventRepository } from '../src/audit/repository.impl.js';
import { createAuditService } from '../src/audit/service.impl.js';
import { createSecurityEventBus } from '../src/events/security-event-bus.js';
import { PolicyNotFoundError, RoleNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const IDENTITY = 'identity-1';

function setup(eventBus = createSecurityEventBus()) {
  const roleRepository = createRoleRepository();
  const policyRepository = createPolicyRepository();
  const assignmentRepository = createRoleAssignmentRepository();
  const auditRepository = createAuditEventRepository();
  const audit = createAuditService(auditRepository, eventBus);
  const authorization = createAuthorizationService(roleRepository, policyRepository, assignmentRepository, audit, eventBus);
  return { roleRepository, policyRepository, assignmentRepository, audit, authorization, eventBus };
}

describe('createAuthorizationService — RBAC + role inheritance', () => {
  it('createRole() creates an active role', async () => {
    const { authorization } = setup();
    const role = await authorization.createRole(ORG, { name: 'analyst', permissions: ['read:reports'] });
    expect(role.status).toBe('active');
  });

  it('assignRole() + getEffectivePermissions() returns the role\'s own permissions', async () => {
    const { authorization } = setup();
    const role = await authorization.createRole(ORG, { name: 'analyst', permissions: ['read:reports'] });
    await authorization.assignRole(ORG, IDENTITY, role.id);
    expect(await authorization.getEffectivePermissions(ORG, IDENTITY)).toEqual(['read:reports']);
  });

  it('walks parent-role inheritance, deduplicating permissions', async () => {
    const { authorization } = setup();
    const base = await authorization.createRole(ORG, { name: 'base', permissions: ['read:reports'] });
    const child = await authorization.createRole(ORG, { name: 'analyst', permissions: ['read:reports', 'write:reports'], parentRoleId: base.id });
    await authorization.assignRole(ORG, IDENTITY, child.id);
    expect(await authorization.getEffectivePermissions(ORG, IDENTITY)).toEqual(['read:reports', 'write:reports']);
  });

  it('walks multi-level inheritance chains', async () => {
    const { authorization } = setup();
    const grandparent = await authorization.createRole(ORG, { name: 'base', permissions: ['perm:a'] });
    const parent = await authorization.createRole(ORG, { name: 'mid', permissions: ['perm:b'], parentRoleId: grandparent.id });
    const child = await authorization.createRole(ORG, { name: 'top', permissions: ['perm:c'], parentRoleId: parent.id });
    await authorization.assignRole(ORG, IDENTITY, child.id);
    expect(await authorization.getEffectivePermissions(ORG, IDENTITY)).toEqual(['perm:a', 'perm:b', 'perm:c']);
  });

  it('is cycle-safe when roles form a parent-role cycle', async () => {
    const { authorization, roleRepository } = setup();
    const roleA = await authorization.createRole(ORG, { name: 'a', permissions: ['perm:a'] });
    const roleB = await authorization.createRole(ORG, { name: 'b', permissions: ['perm:b'], parentRoleId: roleA.id });
    await roleRepository.save({ ...roleA, parentRoleId: roleB.id });
    await authorization.assignRole(ORG, IDENTITY, roleB.id);
    await expect(authorization.getEffectivePermissions(ORG, IDENTITY)).resolves.toEqual(['perm:a', 'perm:b']);
  });

  it('unassignRole() removes a role from an identity', async () => {
    const { authorization } = setup();
    const role = await authorization.createRole(ORG, { name: 'analyst', permissions: ['read:reports'] });
    await authorization.assignRole(ORG, IDENTITY, role.id);
    await authorization.unassignRole(ORG, IDENTITY, role.id);
    expect(await authorization.getEffectivePermissions(ORG, IDENTITY)).toEqual([]);
  });

  it('hasPermission() checks the effective permission set', async () => {
    const { authorization } = setup();
    const role = await authorization.createRole(ORG, { name: 'analyst', permissions: ['read:reports'] });
    await authorization.assignRole(ORG, IDENTITY, role.id);
    expect(await authorization.hasPermission(ORG, IDENTITY, 'read:reports')).toBe(true);
    expect(await authorization.hasPermission(ORG, IDENTITY, 'delete:reports')).toBe(false);
  });

  it('archiveRole() sets status archived', async () => {
    const { authorization } = setup();
    const role = await authorization.createRole(ORG, { name: 'analyst' });
    const archived = await authorization.archiveRole(ORG, role.id);
    expect(archived.status).toBe('archived');
  });

  it('throws RoleNotFoundError for an unknown role', async () => {
    const { authorization } = setup();
    await expect(authorization.archiveRole(ORG, 'missing')).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it('getAssignedRoles() returns only direct assignments', async () => {
    const { authorization } = setup();
    const base = await authorization.createRole(ORG, { name: 'base' });
    const child = await authorization.createRole(ORG, { name: 'child', parentRoleId: base.id });
    await authorization.assignRole(ORG, IDENTITY, child.id);
    const assigned = await authorization.getAssignedRoles(ORG, IDENTITY);
    expect(assigned).toEqual([child.id]);
  });
});

describe('createAuthorizationService — Policy-based access (ABAC + custom)', () => {
  it('createPolicy() creates an active policy and publishes policy.updated', async () => {
    const eventBus = createSecurityEventBus();
    const updated = vi.fn();
    eventBus.subscribe('policy.updated', updated);
    const { authorization } = setup(eventBus);
    const policy = await authorization.createPolicy(ORG, { name: 'deny-external', policyType: 'abac', effect: 'deny', rules: [] });
    expect(policy.status).toBe('active');
    expect(updated).toHaveBeenCalledTimes(1);
  });

  it('updatePolicy() replaces rules and publishes policy.updated', async () => {
    const { authorization } = setup();
    const policy = await authorization.createPolicy(ORG, { name: 'p', policyType: 'abac', effect: 'allow', rules: [] });
    const updated = await authorization.updatePolicy(ORG, policy.id, {
      rules: [{ type: 'attribute', attribute: 'region', operator: 'eq', value: 'us' }],
    });
    expect(updated.rules).toHaveLength(1);
  });

  it('archivePolicy() sets status archived', async () => {
    const { authorization } = setup();
    const policy = await authorization.createPolicy(ORG, { name: 'p', policyType: 'abac', effect: 'allow', rules: [] });
    const archived = await authorization.archivePolicy(ORG, policy.id);
    expect(archived.status).toBe('archived');
  });

  it('throws PolicyNotFoundError for an unknown policy', async () => {
    const { authorization } = setup();
    await expect(authorization.archivePolicy(ORG, 'missing')).rejects.toBeInstanceOf(PolicyNotFoundError);
  });

  it('an archived deny policy no longer overrides RBAC', async () => {
    const { authorization } = setup();
    const role = await authorization.createRole(ORG, { name: 'analyst', permissions: ['read:reports'] });
    await authorization.assignRole(ORG, IDENTITY, role.id);
    const policy = await authorization.createPolicy(ORG, {
      name: 'deny-all',
      policyType: 'custom',
      effect: 'deny',
      rules: [{ type: 'permission', permission: 'read:reports' }],
    });
    await authorization.archivePolicy(ORG, policy.id);
    const result = await authorization.authorize(ORG, { identityId: IDENTITY, permission: 'read:reports', resourceOrganizationId: ORG });
    expect(result.allowed).toBe(true);
  });
});

describe('createAuthorizationService — authorize() (tenant isolation + RBAC + policy overrides)', () => {
  it('denies with tenant_isolation when resourceOrganizationId differs', async () => {
    const { authorization } = setup();
    const result = await authorization.authorize(ORG, { identityId: IDENTITY, permission: 'read:reports', resourceOrganizationId: 'org-2' });
    expect(result).toEqual({ allowed: false, reason: 'tenant_isolation' });
  });

  it('allows when RBAC grants the permission', async () => {
    const { authorization } = setup();
    const role = await authorization.createRole(ORG, { name: 'analyst', permissions: ['read:reports'] });
    await authorization.assignRole(ORG, IDENTITY, role.id);
    const result = await authorization.authorize(ORG, { identityId: IDENTITY, permission: 'read:reports', resourceOrganizationId: ORG });
    expect(result.allowed).toBe(true);
  });

  it('denies with no_permission when RBAC does not grant it and no policy applies', async () => {
    const { authorization } = setup();
    const result = await authorization.authorize(ORG, { identityId: IDENTITY, permission: 'read:reports', resourceOrganizationId: ORG });
    expect(result).toEqual({ allowed: false, reason: 'no_permission' });
  });

  it('a matching deny policy overrides an RBAC grant', async () => {
    const { authorization } = setup();
    const role = await authorization.createRole(ORG, { name: 'analyst', permissions: ['read:reports'] });
    await authorization.assignRole(ORG, IDENTITY, role.id);
    await authorization.createPolicy(ORG, {
      name: 'deny-read',
      policyType: 'custom',
      effect: 'deny',
      rules: [{ type: 'permission', permission: 'read:reports' }],
    });
    const result = await authorization.authorize(ORG, { identityId: IDENTITY, permission: 'read:reports', resourceOrganizationId: ORG });
    expect(result).toEqual({ allowed: false, reason: 'policy_denied' });
  });

  it('a matching allow policy grants access via ABAC attributes when RBAC alone does not', async () => {
    const { authorization } = setup();
    await authorization.createPolicy(ORG, {
      name: 'allow-us-region',
      policyType: 'abac',
      effect: 'allow',
      rules: [{ type: 'attribute', attribute: 'region', operator: 'eq', value: 'us' }],
    });
    const result = await authorization.authorize(ORG, {
      identityId: IDENTITY,
      permission: 'read:reports',
      resourceOrganizationId: ORG,
      attributes: { region: 'us' },
    });
    expect(result.allowed).toBe(true);
  });

  it('an allow policy does not grant access when its attribute rule does not match', async () => {
    const { authorization } = setup();
    await authorization.createPolicy(ORG, {
      name: 'allow-us-region',
      policyType: 'abac',
      effect: 'allow',
      rules: [{ type: 'attribute', attribute: 'region', operator: 'eq', value: 'us' }],
    });
    const result = await authorization.authorize(ORG, {
      identityId: IDENTITY,
      permission: 'read:reports',
      resourceOrganizationId: ORG,
      attributes: { region: 'eu' },
    });
    expect(result.allowed).toBe(false);
  });

  it('a role-type policy rule matches direct role assignment', async () => {
    const { authorization } = setup();
    const role = await authorization.createRole(ORG, { name: 'trusted' });
    await authorization.assignRole(ORG, IDENTITY, role.id);
    await authorization.createPolicy(ORG, { name: 'allow-trusted', policyType: 'rbac', effect: 'allow', rules: [{ type: 'role', roleId: role.id }] });
    const result = await authorization.authorize(ORG, { identityId: IDENTITY, permission: 'anything', resourceOrganizationId: ORG });
    expect(result.allowed).toBe(true);
  });

  it('an "in" attribute operator matches against a list of values', async () => {
    const { authorization } = setup();
    await authorization.createPolicy(ORG, {
      name: 'allow-regions',
      policyType: 'abac',
      effect: 'allow',
      rules: [{ type: 'attribute', attribute: 'region', operator: 'in', value: ['us', 'ca'] }],
    });
    const result = await authorization.authorize(ORG, {
      identityId: IDENTITY,
      permission: 'read:reports',
      resourceOrganizationId: ORG,
      attributes: { region: 'ca' },
    });
    expect(result.allowed).toBe(true);
  });

  it('publishes authorization.denied on denial', async () => {
    const eventBus = createSecurityEventBus();
    const denied = vi.fn();
    eventBus.subscribe('authorization.denied', denied);
    const { authorization } = setup(eventBus);
    await authorization.authorize(ORG, { identityId: IDENTITY, permission: 'read:reports', resourceOrganizationId: ORG });
    await Promise.resolve();
    expect(denied).toHaveBeenCalledTimes(1);
  });

  it('does not publish authorization.denied when allowed', async () => {
    const eventBus = createSecurityEventBus();
    const denied = vi.fn();
    eventBus.subscribe('authorization.denied', denied);
    const { authorization } = setup(eventBus);
    const role = await authorization.createRole(ORG, { name: 'analyst', permissions: ['read:reports'] });
    await authorization.assignRole(ORG, IDENTITY, role.id);
    await authorization.authorize(ORG, { identityId: IDENTITY, permission: 'read:reports', resourceOrganizationId: ORG });
    await Promise.resolve();
    expect(denied).not.toHaveBeenCalled();
  });

  it('records access history in the shared audit service', async () => {
    const { authorization, audit } = setup();
    await authorization.authorize(ORG, { identityId: IDENTITY, permission: 'read:reports', resourceOrganizationId: ORG });
    const history = await audit.findAccessHistory(ORG);
    expect(history.some((event) => event.category === 'authorization')).toBe(true);
  });
});
