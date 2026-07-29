/**
 * Admin Console Runtime — the package's composition root. Wires every
 * real in-memory repository and service together: the Organization
 * Registry, the Tenant/Environment Registry, the Feature Flag
 * Registry, Identity Administration (Users/Groups/Roles/Permissions),
 * System Settings (versioned, global/tenant/organization), Configuration
 * Management, the Audit Center, System Monitoring (composed over the
 * Relationship Layer), the Administration Dashboard (composed over
 * everything above), the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link AdminConsoleRuntime} surface.
 *
 * @module runtime
 */
import { createAuditCenterEngine, createAuditEntryRepository, type AuditCenterEngine } from './audit/index.js';
import { createConfigurationEngine, createRuntimeConfigRepository, type ConfigurationEngine } from './configuration/index.js';
import { createDashboardEngine, createDashboardSnapshotRepository, type DashboardEngine } from './dashboard/index.js';
import { createAdminEventBus, type AdminEventBus } from './events/index.js';
import { createFeatureFlagEngine, createFeatureFlagRepository, type FeatureFlagEngine } from './feature-flags/index.js';
import {
  createGroupRepository,
  createIdentityAdministrationEngine,
  createPermissionRepository,
  createRoleRepository,
  createUserRepository,
  type IdentityAdministrationEngine,
} from './identity/index.js';
import { createMonitoringEngine, type MonitoringEngine } from './monitoring/index.js';
import { createOrganizationEngine, createOrganizationRepository, type OrganizationEngine } from './organizations/index.js';
import { createAdminQueries, type AdminQueries } from './queries/index.js';
import { createRelationshipManagement, type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';
import { createSettingRepository, createSettingsEngine, type SettingsEngine } from './settings/index.js';
import { nowIso } from './shared/id.js';
import { createEnvironmentRepository, createTenantEngine, createTenantRepository, type TenantEngine } from './tenants/index.js';

export interface AdminConsoleRuntimeDeps {
  readonly eventBus?: AdminEventBus;
  readonly now?: () => string;
  readonly apiGateway?: RelationshipManagementDeps['apiGateway'];
  readonly observability?: RelationshipManagementDeps['observability'];
  readonly analytics?: RelationshipManagementDeps['analytics'];
  readonly aiSecurity?: RelationshipManagementDeps['aiSecurity'];
  readonly aiGovernance?: RelationshipManagementDeps['aiGovernance'];
  readonly aiCompliance?: RelationshipManagementDeps['aiCompliance'];
  readonly businessDna?: RelationshipManagementDeps['businessDna'];
  readonly institutionalMemory?: RelationshipManagementDeps['institutionalMemory'];
  readonly communicationHub?: RelationshipManagementDeps['communicationHub'];
}

export interface AdminConsoleRuntime {
  readonly organizations: OrganizationEngine;
  readonly tenants: TenantEngine;
  readonly featureFlags: FeatureFlagEngine;
  readonly identity: IdentityAdministrationEngine;
  readonly settings: SettingsEngine;
  readonly configuration: ConfigurationEngine;
  readonly audit: AuditCenterEngine;
  readonly monitoring: MonitoringEngine;
  readonly dashboard: DashboardEngine;
  readonly relationshipManagement: RelationshipManagement;
  readonly queries: AdminQueries;
  /** Typed event bus — subscribe to organization/tenant/user/role/settings/feature/audit/dashboard/configuration events. */
  readonly events: AdminEventBus;
}

/** Creates a real, in-memory {@link AdminConsoleRuntime}. */
export function createAdminConsoleRuntime(deps: AdminConsoleRuntimeDeps = {}): AdminConsoleRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createAdminEventBus();

  const organizationRepository = createOrganizationRepository();
  const tenantRepository = createTenantRepository();
  const environmentRepository = createEnvironmentRepository();
  const featureFlagRepository = createFeatureFlagRepository();
  const permissionRepository = createPermissionRepository();
  const roleRepository = createRoleRepository();
  const groupRepository = createGroupRepository();
  const userRepository = createUserRepository();
  const settingRepository = createSettingRepository();
  const runtimeConfigRepository = createRuntimeConfigRepository();
  const auditEntryRepository = createAuditEntryRepository();
  const dashboardSnapshotRepository = createDashboardSnapshotRepository();

  const organizations = createOrganizationEngine(organizationRepository, eventBus, now);
  const tenants = createTenantEngine(tenantRepository, environmentRepository, eventBus, now);
  const featureFlags = createFeatureFlagEngine(featureFlagRepository, eventBus, now);
  const identity = createIdentityAdministrationEngine(permissionRepository, roleRepository, groupRepository, userRepository, eventBus, now);
  const settings = createSettingsEngine(settingRepository, eventBus, now);
  const configuration = createConfigurationEngine(runtimeConfigRepository, eventBus, now);
  const audit = createAuditCenterEngine(auditEntryRepository, eventBus, now);

  const relationshipManagement = createRelationshipManagement({
    apiGateway: deps.apiGateway,
    observability: deps.observability,
    analytics: deps.analytics,
    aiSecurity: deps.aiSecurity,
    aiGovernance: deps.aiGovernance,
    aiCompliance: deps.aiCompliance,
    businessDna: deps.businessDna,
    institutionalMemory: deps.institutionalMemory,
    communicationHub: deps.communicationHub,
  });

  const monitoring = createMonitoringEngine(relationshipManagement);
  const dashboard = createDashboardEngine(dashboardSnapshotRepository, tenants, featureFlags, identity, audit, monitoring, eventBus, now);

  const queries = createAdminQueries({
    organizationRepository,
    tenantRepository,
    userRepository,
    roleRepository,
    settingRepository,
    auditEntryRepository,
    dashboardSnapshotRepository,
    featureFlagRepository,
  });

  return {
    organizations,
    tenants,
    featureFlags,
    identity,
    settings,
    configuration,
    audit,
    monitoring,
    dashboard,
    relationshipManagement,
    queries,
    events: eventBus,
  };
}
