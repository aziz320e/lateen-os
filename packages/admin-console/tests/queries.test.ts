import { describe, expect, it } from 'vitest';
import { createAuditCenterEngine } from '../src/audit/engine.impl.js';
import { createAuditEntryRepository } from '../src/audit/repository.impl.js';
import { createDashboardEngine } from '../src/dashboard/engine.impl.js';
import { createDashboardSnapshotRepository } from '../src/dashboard/repository.impl.js';
import { createFeatureFlagEngine } from '../src/feature-flags/engine.impl.js';
import { createFeatureFlagRepository } from '../src/feature-flags/repository.impl.js';
import { createGroupRepository, createIdentityAdministrationEngine, createPermissionRepository, createRoleRepository, createUserRepository } from '../src/identity/index.js';
import { createMonitoringEngine } from '../src/monitoring/engine.impl.js';
import { createOrganizationEngine } from '../src/organizations/engine.impl.js';
import { createOrganizationRepository } from '../src/organizations/repository.impl.js';
import { createAdminQueries } from '../src/queries/admin-queries.impl.js';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import { createSettingRepository } from '../src/settings/repository.impl.js';
import { createSettingsEngine } from '../src/settings/engine.impl.js';
import { createEnvironmentRepository, createTenantEngine, createTenantRepository } from '../src/tenants/index.js';

const ORG = 'org-1';

async function setup() {
  const organizationRepository = createOrganizationRepository();
  const tenantRepository = createTenantRepository();
  const environmentRepository = createEnvironmentRepository();
  const permissionRepository = createPermissionRepository();
  const roleRepository = createRoleRepository();
  const groupRepository = createGroupRepository();
  const userRepository = createUserRepository();
  const settingRepository = createSettingRepository();
  const auditEntryRepository = createAuditEntryRepository();
  const dashboardSnapshotRepository = createDashboardSnapshotRepository();
  const featureFlagRepository = createFeatureFlagRepository();

  const organizations = createOrganizationEngine(organizationRepository);
  const tenants = createTenantEngine(tenantRepository, environmentRepository);
  const identity = createIdentityAdministrationEngine(permissionRepository, roleRepository, groupRepository, userRepository);
  const settings = createSettingsEngine(settingRepository);
  const audit = createAuditCenterEngine(auditEntryRepository);
  const featureFlags = createFeatureFlagEngine(featureFlagRepository);
  const monitoring = createMonitoringEngine(createRelationshipManagement({}));
  const dashboard = createDashboardEngine(dashboardSnapshotRepository, tenants, featureFlags, identity, audit, monitoring);

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

  return { organizations, tenants, identity, settings, audit, featureFlags, dashboard, queries };
}

describe('AdminQueries', () => {
  it('findOrganizations() filters by status and paginates', async () => {
    const { organizations, queries } = await setup();
    const orgA = await organizations.registerOrganization('org-a', { name: 'A' });
    await organizations.registerOrganization('org-b', { name: 'B' });
    await organizations.suspendOrganization(orgA.id);

    const active = await queries.findOrganizations({ status: 'active' });
    expect(active.total).toBe(1);

    const all = await queries.findOrganizations({ limit: 1 });
    expect(all.organizations).toHaveLength(1);
    expect(all.total).toBe(2);
  });

  it('findTenants() filters by status', async () => {
    const { tenants, queries } = await setup();
    const tenant = await tenants.createTenant(ORG, { name: 'Tenant One' });
    await tenants.suspendTenant(ORG, tenant.id);
    expect((await queries.findTenants({ organizationId: ORG, status: 'suspended' })).total).toBe(1);
    expect((await queries.findTenants({ organizationId: ORG, status: 'active' })).total).toBe(0);
  });

  it('findUsers() filters by status', async () => {
    const { identity, queries } = await setup();
    const user = await identity.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    await identity.suspendUser(ORG, user.id);
    expect((await queries.findUsers({ organizationId: ORG, status: 'suspended' })).total).toBe(1);
  });

  it('findRoles() filters by status', async () => {
    const { identity, queries } = await setup();
    const role = await identity.createRole(ORG, { name: 'Viewer' });
    await identity.archiveRole(ORG, role.id);
    expect((await queries.findRoles({ organizationId: ORG, status: 'archived' })).total).toBe(1);
    expect((await queries.findRoles({ organizationId: ORG, status: 'active' })).total).toBe(0);
  });

  it('findSettings() includes global settings alongside the organization’s own settings', async () => {
    const { settings, queries } = await setup();
    await settings.upsertGlobalSetting('platform.name', 'Lateen OS');
    await settings.upsertOrganizationSetting(ORG, 'theme', 'dark');
    await settings.upsertOrganizationSetting('org-2', 'theme', 'light');

    const result = await queries.findSettings({ organizationId: ORG });
    expect(result.total).toBe(2);
  });

  it('findSettings() filters by scope', async () => {
    const { settings, queries } = await setup();
    await settings.upsertGlobalSetting('platform.name', 'Lateen OS');
    await settings.upsertOrganizationSetting(ORG, 'theme', 'dark');
    expect((await queries.findSettings({ organizationId: ORG, scope: 'global' })).total).toBe(1);
    expect((await queries.findSettings({ organizationId: ORG, scope: 'organization' })).total).toBe(1);
  });

  it('findAudits() filters by action', async () => {
    const { audit, queries } = await setup();
    await audit.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    await audit.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'logout', target: { type: 'session', id: 's1' } });
    expect((await queries.findAudits({ organizationId: ORG, action: 'login' })).total).toBe(1);
    expect((await queries.findAudits({ organizationId: ORG })).total).toBe(2);
  });

  it('findDashboard() returns the latest generated snapshot', async () => {
    const { dashboard, queries } = await setup();
    expect((await queries.findDashboard({ organizationId: ORG })).dashboard).toBeNull();
    const snapshot = await dashboard.generateDashboard(ORG);
    const result = await queries.findDashboard({ organizationId: ORG });
    expect(result.dashboard?.id).toBe(snapshot.id);
  });

  it('searchAdministration() finds tenants, users, roles, and feature flags by keyword', async () => {
    const { tenants, identity, featureFlags, queries } = await setup();
    await tenants.createTenant(ORG, { name: 'Acme Tenant' });
    await identity.createUser(ORG, { email: 'acme@b.com', displayName: 'Acme User' });
    await identity.createRole(ORG, { name: 'Acme Role' });
    await featureFlags.registerFlag(ORG, { key: 'acme-flag' });

    const result = await queries.searchAdministration({ organizationId: ORG, keyword: 'acme' });
    expect(result.total).toBe(4);
    const recordTypes = result.matches.map((match) => match.recordType).sort();
    expect(recordTypes).toEqual(['feature-flag', 'role', 'tenant', 'user']);
  });

  it('searchAdministration() returns no matches for an unrelated keyword', async () => {
    const { tenants, queries } = await setup();
    await tenants.createTenant(ORG, { name: 'Acme Tenant' });
    const result = await queries.searchAdministration({ organizationId: ORG, keyword: 'zzz-no-match' });
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('searchAdministration() respects an explicit limit', async () => {
    const { tenants, queries } = await setup();
    await tenants.createTenant(ORG, { name: 'Acme One' });
    await tenants.createTenant(ORG, { name: 'Acme Two' });
    const result = await queries.searchAdministration({ organizationId: ORG, keyword: 'acme', limit: 1 });
    expect(result.matches).toHaveLength(1);
  });

  it('searchAdministration() ranks an exact match above a substring match', async () => {
    const { tenants, queries } = await setup();
    await tenants.createTenant(ORG, { name: 'acme' });
    await tenants.createTenant(ORG, { name: 'acme-extended' });
    const result = await queries.searchAdministration({ organizationId: ORG, keyword: 'acme' });
    expect(result.matches[0]?.score).toBe(3);
  });

  it('findOrganizations() is a platform-wide query, not scoped to a single organization', async () => {
    const { organizations, queries } = await setup();
    await organizations.registerOrganization('org-a', { name: 'A' });
    await organizations.registerOrganization('org-b', { name: 'B' });
    const result = await queries.findOrganizations({});
    expect(result.total).toBe(2);
  });

  it('findOrganizations() returns an empty result set when nothing has been registered', async () => {
    const { queries } = await setup();
    expect(await queries.findOrganizations({})).toEqual({ organizations: [], total: 0 });
  });

  it('findTenants() is isolated per organization', async () => {
    const { tenants, queries } = await setup();
    await tenants.createTenant(ORG, { name: 'Tenant One' });
    await tenants.createTenant('org-2', { name: 'Tenant One' });
    expect((await queries.findTenants({ organizationId: ORG })).total).toBe(1);
  });

  it('findUsers() is isolated per organization', async () => {
    const { identity, queries } = await setup();
    await identity.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    expect((await queries.findUsers({ organizationId: 'org-2' })).total).toBe(0);
  });

  it('findAudits() is isolated per organization', async () => {
    const { audit, queries } = await setup();
    await audit.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    expect((await queries.findAudits({ organizationId: 'org-2' })).total).toBe(0);
  });

  it('findDashboard() returns null when nothing has ever been generated for that organization', async () => {
    const { queries } = await setup();
    const result = await queries.findDashboard({ organizationId: 'org-without-dashboards' });
    expect(result.dashboard).toBeNull();
  });

  it('findRoles() with no filter returns every role for the organization', async () => {
    const { identity, queries } = await setup();
    await identity.createRole(ORG, { name: 'Viewer' });
    await identity.createRole(ORG, { name: 'Editor' });
    expect((await queries.findRoles({ organizationId: ORG })).total).toBe(2);
  });

  it('searchAdministration() finds a user by email even when the displayName does not match', async () => {
    const { identity, queries } = await setup();
    await identity.createUser(ORG, { email: 'zephyr@b.com', displayName: 'Someone Else' });
    const result = await queries.searchAdministration({ organizationId: ORG, keyword: 'zephyr' });
    expect(result.matches.some((match) => match.recordType === 'user')).toBe(true);
  });

  it('findOrganizations() with a status filter and no matches returns an empty result set', async () => {
    const { organizations, queries } = await setup();
    await organizations.registerOrganization(ORG, { name: 'Acme Co' });
    expect((await queries.findOrganizations({ status: 'archived' })).total).toBe(0);
  });

  it('findTenants() with no filter returns every tenant for the organization', async () => {
    const { tenants, queries } = await setup();
    await tenants.createTenant(ORG, { name: 'A' });
    await tenants.createTenant(ORG, { name: 'B' });
    expect((await queries.findTenants({ organizationId: ORG })).total).toBe(2);
  });

  it('findSettings() is empty when nothing has been configured at all', async () => {
    const { queries } = await setup();
    expect(await queries.findSettings({ organizationId: ORG })).toEqual({ settings: [], total: 0 });
  });

  it('findUsers() with no filter returns every user for the organization', async () => {
    const { identity, queries } = await setup();
    await identity.createUser(ORG, { email: 'a@b.com', displayName: 'A' });
    await identity.createUser(ORG, { email: 'c@b.com', displayName: 'C' });
    expect((await queries.findUsers({ organizationId: ORG })).total).toBe(2);
  });

  it('findAudits() with no filter returns every audit entry for the organization', async () => {
    const { audit, queries } = await setup();
    await audit.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    expect((await queries.findAudits({ organizationId: ORG })).total).toBe(1);
  });

  it('searchAdministration() with an empty keyword matches everything via substring semantics', async () => {
    const { tenants, queries } = await setup();
    await tenants.createTenant(ORG, { name: 'Anything' });
    const result = await queries.searchAdministration({ organizationId: ORG, keyword: '' });
    expect(result.total).toBeGreaterThan(0);
  });

  it('findOrganizations() supports pagination via offset and limit together', async () => {
    const { organizations, queries } = await setup();
    await organizations.registerOrganization('org-a', { name: 'A' });
    await organizations.registerOrganization('org-b', { name: 'B' });
    await organizations.registerOrganization('org-c', { name: 'C' });
    const page = await queries.findOrganizations({ offset: 1, limit: 1 });
    expect(page.organizations).toHaveLength(1);
    expect(page.total).toBe(3);
  });

  it('findRoles() is isolated per organization', async () => {
    const { identity, queries } = await setup();
    await identity.createRole(ORG, { name: 'Viewer' });
    expect((await queries.findRoles({ organizationId: 'org-2' })).total).toBe(0);
  });

  it('findSettings() with a limit returns a bounded page while total reflects the full match count', async () => {
    const { settings, queries } = await setup();
    await settings.upsertOrganizationSetting(ORG, 'a', 1);
    await settings.upsertOrganizationSetting(ORG, 'b', 2);
    await settings.upsertOrganizationSetting(ORG, 'c', 3);
    const page = await queries.findSettings({ organizationId: ORG, limit: 2 });
    expect(page.settings).toHaveLength(2);
    expect(page.total).toBe(3);
  });
});
