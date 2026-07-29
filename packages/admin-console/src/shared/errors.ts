/** Typed errors used consistently across the Admin Console runtime implementations. @module shared/errors */

export class DuplicateOrganizationError extends Error {
  constructor(readonly organizationId: string) {
    super(`Organization "${organizationId}" is already registered`);
    this.name = 'DuplicateOrganizationError';
  }
}

export class OrganizationNotFoundError extends Error {
  constructor(readonly organizationId: string) {
    super(`Organization "${organizationId}" not found`);
    this.name = 'OrganizationNotFoundError';
  }
}

export class InvalidOrganizationTransitionError extends Error {
  constructor(
    readonly organizationId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Organization "${organizationId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidOrganizationTransitionError';
  }
}

export class TenantNotFoundError extends Error {
  constructor(readonly tenantId: string) {
    super(`Tenant "${tenantId}" not found`);
    this.name = 'TenantNotFoundError';
  }
}

export class InvalidTenantTransitionError extends Error {
  constructor(
    readonly tenantId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Tenant "${tenantId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidTenantTransitionError';
  }
}

export class EnvironmentNotFoundError extends Error {
  constructor(readonly environmentId: string) {
    super(`Environment "${environmentId}" not found`);
    this.name = 'EnvironmentNotFoundError';
  }
}

export class FeatureFlagNotFoundError extends Error {
  constructor(readonly featureFlagId: string) {
    super(`Feature flag "${featureFlagId}" not found`);
    this.name = 'FeatureFlagNotFoundError';
  }
}

export class UserNotFoundError extends Error {
  constructor(readonly userId: string) {
    super(`User "${userId}" not found`);
    this.name = 'UserNotFoundError';
  }
}

export class GroupNotFoundError extends Error {
  constructor(readonly groupId: string) {
    super(`Group "${groupId}" not found`);
    this.name = 'GroupNotFoundError';
  }
}

export class RoleNotFoundError extends Error {
  constructor(readonly roleId: string) {
    super(`Role "${roleId}" not found`);
    this.name = 'RoleNotFoundError';
  }
}

export class PermissionNotFoundError extends Error {
  constructor(readonly permissionId: string) {
    super(`Permission "${permissionId}" not found`);
    this.name = 'PermissionNotFoundError';
  }
}

export class UnknownPermissionCodeError extends Error {
  constructor(readonly code: string) {
    super(`Permission code "${code}" is not registered`);
    this.name = 'UnknownPermissionCodeError';
  }
}

export class RuntimeConfigNotFoundError extends Error {
  constructor(readonly runtimeConfigId: string) {
    super(`Runtime configuration "${runtimeConfigId}" not found`);
    this.name = 'RuntimeConfigNotFoundError';
  }
}

export class ConfigValidationError extends Error {
  constructor(readonly errors: readonly string[]) {
    super(`Configuration validation failed: ${errors.join('; ')}`);
    this.name = 'ConfigValidationError';
  }
}

export class DashboardSnapshotNotFoundError extends Error {
  constructor(readonly dashboardSnapshotId: string) {
    super(`Dashboard snapshot "${dashboardSnapshotId}" not found`);
    this.name = 'DashboardSnapshotNotFoundError';
  }
}
