/** @module events/admin-events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type OrganizationCreatedEvent = DomainEvent<
  'organization.created',
  { readonly organizationId: string; readonly name: string }
>;

export type TenantCreatedEvent = DomainEvent<
  'tenant.created',
  { readonly organizationId: string; readonly tenantId: string; readonly name: string }
>;

export type UserCreatedEvent = DomainEvent<
  'user.created',
  { readonly organizationId: string; readonly userId: string; readonly email: string }
>;

export type RoleCreatedEvent = DomainEvent<
  'role.created',
  { readonly organizationId: string; readonly roleId: string; readonly name: string }
>;

export type SettingsUpdatedEvent = DomainEvent<
  'settings.updated',
  { readonly organizationId: string; readonly settingId: string; readonly key: string; readonly scope: string }
>;

export type FeatureEnabledEvent = DomainEvent<
  'feature.enabled',
  { readonly organizationId: string; readonly featureFlagId: string; readonly key: string }
>;

export type FeatureDisabledEvent = DomainEvent<
  'feature.disabled',
  { readonly organizationId: string; readonly featureFlagId: string; readonly key: string }
>;

export type AuditRecordedEvent = DomainEvent<
  'audit.recorded',
  { readonly organizationId: string; readonly auditEntryId: string; readonly action: string }
>;

export type DashboardGeneratedEvent = DomainEvent<
  'dashboard.generated',
  { readonly organizationId: string; readonly dashboardSnapshotId: string }
>;

export type ConfigurationUpdatedEvent = DomainEvent<
  'configuration.updated',
  { readonly organizationId: string; readonly runtimeConfigId: string; readonly key: string }
>;

/** Canonical event names for external subscribers. */
export const ADMIN_EVENT_NAMES = {
  OrganizationCreated: 'organization.created',
  TenantCreated: 'tenant.created',
  UserCreated: 'user.created',
  RoleCreated: 'role.created',
  SettingsUpdated: 'settings.updated',
  FeatureEnabled: 'feature.enabled',
  FeatureDisabled: 'feature.disabled',
  AuditRecorded: 'audit.recorded',
  DashboardGenerated: 'dashboard.generated',
  ConfigurationUpdated: 'configuration.updated',
} as const;

/** Union of all Admin Console domain events. */
export type AdminDomainEvent =
  | OrganizationCreatedEvent
  | TenantCreatedEvent
  | UserCreatedEvent
  | RoleCreatedEvent
  | SettingsUpdatedEvent
  | FeatureEnabledEvent
  | FeatureDisabledEvent
  | AuditRecordedEvent
  | DashboardGeneratedEvent
  | ConfigurationUpdatedEvent;
