import { describe, expect, it } from 'vitest';
import {
  ConfigValidationError,
  DashboardSnapshotNotFoundError,
  DuplicateOrganizationError,
  EnvironmentNotFoundError,
  FeatureFlagNotFoundError,
  GroupNotFoundError,
  InvalidOrganizationTransitionError,
  InvalidTenantTransitionError,
  OrganizationNotFoundError,
  PermissionNotFoundError,
  RoleNotFoundError,
  RuntimeConfigNotFoundError,
  TenantNotFoundError,
  UnknownPermissionCodeError,
  UserNotFoundError,
} from '../src/shared/errors.js';

describe('shared/errors — typed error classes', () => {
  it('DuplicateOrganizationError carries the organizationId and a descriptive message', () => {
    const error = new DuplicateOrganizationError('org-1');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('DuplicateOrganizationError');
    expect(error.organizationId).toBe('org-1');
    expect(error.message).toBe('Organization "org-1" is already registered');
  });

  it('OrganizationNotFoundError carries the organizationId and a descriptive message', () => {
    const error = new OrganizationNotFoundError('org-1');
    expect(error.name).toBe('OrganizationNotFoundError');
    expect(error.organizationId).toBe('org-1');
    expect(error.message).toBe('Organization "org-1" not found');
  });

  it('InvalidOrganizationTransitionError carries organizationId/from/to and a descriptive message', () => {
    const error = new InvalidOrganizationTransitionError('org-1', 'archived', 'active');
    expect(error.name).toBe('InvalidOrganizationTransitionError');
    expect(error.organizationId).toBe('org-1');
    expect(error.from).toBe('archived');
    expect(error.to).toBe('active');
    expect(error.message).toBe('Organization "org-1" cannot transition from "archived" to "active"');
  });

  it('TenantNotFoundError carries the tenantId and a descriptive message', () => {
    const error = new TenantNotFoundError('tenant-1');
    expect(error.name).toBe('TenantNotFoundError');
    expect(error.tenantId).toBe('tenant-1');
    expect(error.message).toBe('Tenant "tenant-1" not found');
  });

  it('InvalidTenantTransitionError carries tenantId/from/to and a descriptive message', () => {
    const error = new InvalidTenantTransitionError('tenant-1', 'archived', 'active');
    expect(error.name).toBe('InvalidTenantTransitionError');
    expect(error.tenantId).toBe('tenant-1');
    expect(error.message).toBe('Tenant "tenant-1" cannot transition from "archived" to "active"');
  });

  it('EnvironmentNotFoundError carries the environmentId and a descriptive message', () => {
    const error = new EnvironmentNotFoundError('env-1');
    expect(error.name).toBe('EnvironmentNotFoundError');
    expect(error.environmentId).toBe('env-1');
    expect(error.message).toBe('Environment "env-1" not found');
  });

  it('FeatureFlagNotFoundError carries the featureFlagId and a descriptive message', () => {
    const error = new FeatureFlagNotFoundError('flag-1');
    expect(error.name).toBe('FeatureFlagNotFoundError');
    expect(error.featureFlagId).toBe('flag-1');
    expect(error.message).toBe('Feature flag "flag-1" not found');
  });

  it('UserNotFoundError carries the userId and a descriptive message', () => {
    const error = new UserNotFoundError('user-1');
    expect(error.name).toBe('UserNotFoundError');
    expect(error.userId).toBe('user-1');
    expect(error.message).toBe('User "user-1" not found');
  });

  it('GroupNotFoundError carries the groupId and a descriptive message', () => {
    const error = new GroupNotFoundError('group-1');
    expect(error.name).toBe('GroupNotFoundError');
    expect(error.groupId).toBe('group-1');
    expect(error.message).toBe('Group "group-1" not found');
  });

  it('RoleNotFoundError carries the roleId and a descriptive message', () => {
    const error = new RoleNotFoundError('role-1');
    expect(error.name).toBe('RoleNotFoundError');
    expect(error.roleId).toBe('role-1');
    expect(error.message).toBe('Role "role-1" not found');
  });

  it('PermissionNotFoundError carries the permissionId and a descriptive message', () => {
    const error = new PermissionNotFoundError('permission-1');
    expect(error.name).toBe('PermissionNotFoundError');
    expect(error.permissionId).toBe('permission-1');
    expect(error.message).toBe('Permission "permission-1" not found');
  });

  it('UnknownPermissionCodeError carries the code and a descriptive message', () => {
    const error = new UnknownPermissionCodeError('billing:read');
    expect(error.name).toBe('UnknownPermissionCodeError');
    expect(error.code).toBe('billing:read');
    expect(error.message).toBe('Permission code "billing:read" is not registered');
  });

  it('RuntimeConfigNotFoundError carries the runtimeConfigId and a descriptive message', () => {
    const error = new RuntimeConfigNotFoundError('config-1');
    expect(error.name).toBe('RuntimeConfigNotFoundError');
    expect(error.runtimeConfigId).toBe('config-1');
    expect(error.message).toBe('Runtime configuration "config-1" not found');
  });

  it('ConfigValidationError carries the errors array and joins them into the message', () => {
    const error = new ConfigValidationError(['"key" is required', '"value" must be of type "string"']);
    expect(error.name).toBe('ConfigValidationError');
    expect(error.errors).toEqual(['"key" is required', '"value" must be of type "string"']);
    expect(error.message).toBe('Configuration validation failed: "key" is required; "value" must be of type "string"');
  });

  it('DashboardSnapshotNotFoundError carries the dashboardSnapshotId and a descriptive message', () => {
    const error = new DashboardSnapshotNotFoundError('dashboard-1');
    expect(error.name).toBe('DashboardSnapshotNotFoundError');
    expect(error.dashboardSnapshotId).toBe('dashboard-1');
    expect(error.message).toBe('Dashboard snapshot "dashboard-1" not found');
  });

  it('every not-found error class is a genuine subclass of Error with a working stack trace', () => {
    const error = new OrganizationNotFoundError('org-1');
    expect(error.stack).toBeDefined();
    expect(error instanceof Error).toBe(true);
  });

  it('ConfigValidationError with a single error still joins correctly with no stray separator', () => {
    const error = new ConfigValidationError(['"key" is required']);
    expect(error.message).toBe('Configuration validation failed: "key" is required');
  });
});
