/**
 * @lateen-os/admin-console — Admin Console
 *
 * A real, deterministic, framework-agnostic Admin Console: the
 * Organization/Tenant/Environment/Feature Flag registries
 * (Administration), Identity Administration (Users/Groups/Roles/
 * Permissions — composed with AI Security Engine, never duplicating
 * authentication), System Settings (versioned, global/tenant/
 * organization), Configuration Management (runtime configuration,
 * environment overrides, validation), the Audit Center, System
 * Monitoring (composed over Observability/Analytics/Security/
 * Governance/Compliance, never duplicating monitoring logic), and the
 * Administration Dashboard. See `runtime.ts`'s
 * `createAdminConsoleRuntime()` for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as organizations from './organizations/index.js';
export * as tenants from './tenants/index.js';
export * as featureFlags from './feature-flags/index.js';
export * as identity from './identity/index.js';
export * as settings from './settings/index.js';
export * as configuration from './configuration/index.js';
export * as audit from './audit/index.js';
export * as monitoring from './monitoring/index.js';
export * as dashboard from './dashboard/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createAdminConsoleRuntime,
  type AdminConsoleRuntime,
  type AdminConsoleRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { Organization, OrganizationPlan, OrganizationStatus } from './organizations/types.js';
export type { Tenant, TenantStatus, Environment, EnvironmentType, EnvironmentStatus } from './tenants/types.js';
export type { FeatureFlag } from './feature-flags/types.js';
export type { User, UserStatus, Group, GroupStatus, Role, RoleStatus, Permission, PermissionStatus } from './identity/types.js';
export type { Setting, SettingScope, SettingVersionRecord } from './settings/types.js';
export type { RuntimeConfigEntry, ConfigFieldSchema, ConfigFieldType } from './configuration/types.js';
export type { AuditEntry, AuditActor, AuditTarget } from './audit/types.js';
export type { DashboardSnapshot, SystemStatus, TenantStatusSummary, HealthSummary, AlertsSummary } from './dashboard/types.js';

/** Real lifecycle/service ports. */
export {
  canTransitionOrganization,
  type OrganizationEngine,
  type RegisterOrganizationInput,
} from './organizations/engine.impl.js';
export {
  canTransitionTenant,
  type TenantEngine,
  type CreateTenantInput,
  type CreateEnvironmentInput,
} from './tenants/engine.impl.js';
export {
  type FeatureFlagEngine,
  type RegisterFeatureFlagInput,
  type FeatureFlagResolutionContext,
} from './feature-flags/engine.impl.js';
export {
  type IdentityAdministrationEngine,
  type CreatePermissionInput,
  type CreateRoleInput,
  type CreateGroupInput,
  type CreateUserInput,
} from './identity/engine.impl.js';
export { type SettingsEngine } from './settings/engine.impl.js';
export {
  validateConfigPayload,
  type ConfigurationEngine,
  type SetRuntimeConfigInput,
  type ValidationResult,
} from './configuration/engine.impl.js';
export { type AuditCenterEngine, type RecordAuditInput } from './audit/engine.impl.js';
export { type MonitoringEngine, type SystemMonitoringSnapshot } from './monitoring/engine.impl.js';
export { computeSystemStatus, type DashboardEngine } from './dashboard/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { OrganizationRepository } from './organizations/repository.js';
export type { TenantRepository, EnvironmentRepository } from './tenants/repository.js';
export type { FeatureFlagRepository } from './feature-flags/repository.js';
export type { PermissionRepository, RoleRepository, GroupRepository, UserRepository } from './identity/repository.js';
export type { SettingRepository } from './settings/repository.js';
export type { RuntimeConfigRepository } from './configuration/repository.js';
export type { AuditEntryRepository } from './audit/repository.js';
export type { DashboardSnapshotRepository } from './dashboard/repository.js';

/** Relationship Layer (all 9 required sibling package integrations). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { AdminQueries } from './queries/admin-queries.js';

/** Typed event bus. */
export type { AdminDomainEvent } from './events/admin-events.js';
export { ADMIN_EVENT_NAMES } from './events/admin-events.js';
export type { AdminEventBus } from './events/admin-event-bus.js';
