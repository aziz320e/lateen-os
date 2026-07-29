import { describe, expect, it } from 'vitest';
import { createAdminEventBus } from '../src/events/index.js';
import { createAdminConsoleRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createAdminConsoleRuntime — composition root', () => {
  it('wires every engine onto the returned runtime surface', () => {
    const admin = createAdminConsoleRuntime();
    expect(admin.organizations).toBeDefined();
    expect(admin.tenants).toBeDefined();
    expect(admin.featureFlags).toBeDefined();
    expect(admin.identity).toBeDefined();
    expect(admin.settings).toBeDefined();
    expect(admin.configuration).toBeDefined();
    expect(admin.audit).toBeDefined();
    expect(admin.monitoring).toBeDefined();
    expect(admin.dashboard).toBeDefined();
    expect(admin.relationshipManagement).toBeDefined();
    expect(admin.queries).toBeDefined();
    expect(admin.events).toBeDefined();
  });

  it('is fully usable with zero deps — every collaborator degrades gracefully', async () => {
    const admin = createAdminConsoleRuntime();
    expect(await admin.relationshipManagement.getApiGatewayContext(ORG)).toEqual([]);
    expect(await admin.relationshipManagement.getBusinessProfileContext(ORG)).toBeNull();
  });

  it('an injected eventBus is used instead of creating a new one, and is the same instance returned as .events', () => {
    const eventBus = createAdminEventBus();
    const admin = createAdminConsoleRuntime({ eventBus });
    expect(admin.events).toBe(eventBus);
  });

  it('organization events are observable on the injected eventBus', async () => {
    const eventBus = createAdminEventBus();
    const admin = createAdminConsoleRuntime({ eventBus });
    let seen: unknown;
    eventBus.subscribe('organization.created', (payload) => (seen = payload));
    await admin.organizations.registerOrganization(ORG, { name: 'Acme Co' });
    expect(seen).toEqual({ organizationId: ORG, name: 'Acme Co' });
  });

  it('an injected now() clock is used across engines for deterministic timestamps', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const admin = createAdminConsoleRuntime({ now: fixedNow });
    const organization = await admin.organizations.registerOrganization(ORG, { name: 'Acme Co' });
    expect(organization.createdAt).toBe('2026-01-01T00:00:00.000Z');
    const tenant = await admin.tenants.createTenant(ORG, { name: 'Tenant One' });
    expect(tenant.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('an injected apiGateway dep flows through to relationshipManagement.getApiGatewayContext', async () => {
    const admin = createAdminConsoleRuntime({ apiGateway: { queries: { findApis: async () => ({ apis: [{ id: 'api-1' } as never], total: 1 }) } as never } });
    expect(await admin.relationshipManagement.getApiGatewayContext(ORG)).toEqual([{ id: 'api-1' }]);
  });

  it('repositories are never part of the returned runtime surface', () => {
    const admin = createAdminConsoleRuntime();
    expect(Object.keys(admin)).not.toContain('organizationRepository');
    expect(Object.keys(admin)).not.toContain('userRepository');
  });

  it('the dashboard engine is composed intra-package with tenants/featureFlags/identity/audit registered through the same runtime', async () => {
    const admin = createAdminConsoleRuntime();
    await admin.tenants.createTenant(ORG, { name: 'Tenant One' });
    await admin.identity.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    const snapshot = await admin.dashboard.generateDashboard(ORG);
    expect(snapshot.kpis['tenantCount']).toBe(1);
    expect(snapshot.kpis['userCount']).toBe(1);
  });

  it('the monitoring engine is composed over the runtime’s own relationship management', async () => {
    const admin = createAdminConsoleRuntime({ analytics: { queries: { findKPIs: async () => ({ kpis: [{ id: 'kpi-1' } as never], total: 1 }) } as never } });
    const snapshot = await admin.monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.analyticsKpiCount).toBe(1);
  });

  it('the query layer and the identity engine both observe the same registered role', async () => {
    const admin = createAdminConsoleRuntime();
    const role = await admin.identity.createRole(ORG, { name: 'Viewer' });
    const found = await admin.queries.findRoles({ organizationId: ORG });
    expect(found.roles.map((r) => r.id)).toContain(role.id);
  });

  it('two independently created runtimes do not share state', async () => {
    const first = createAdminConsoleRuntime();
    const second = createAdminConsoleRuntime();
    await first.organizations.registerOrganization(ORG, { name: 'Acme Co' });
    expect(await second.organizations.listOrganizations()).toEqual([]);
  });

  it('an injected businessDna dep flows through to relationshipManagement.getBusinessProfileContext', async () => {
    const admin = createAdminConsoleRuntime({ businessDna: { businessProfile: { get: async () => ({ displayName: 'Acme Co' } as never) } as never } });
    expect(await admin.relationshipManagement.getBusinessProfileContext(ORG)).toEqual({ displayName: 'Acme Co' });
  });

  it('an injected communicationHub dep flows through to relationshipManagement.notifyAdminEvent', async () => {
    const admin = createAdminConsoleRuntime({
      communicationHub: {
        notifications: {
          create: async () => ({ id: 'notif-1' } as never),
          send: async () => ({ id: 'notif-1', status: 'sent' } as never),
        } as never,
      },
    });
    const result = await admin.relationshipManagement.notifyAdminEvent(ORG, { title: 'Test' });
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });

  it('feature flag events are observable on the injected eventBus', async () => {
    const eventBus = createAdminEventBus();
    const admin = createAdminConsoleRuntime({ eventBus });
    let seen: unknown;
    eventBus.subscribe('feature.enabled', (payload) => (seen = payload));
    const flag = await admin.featureFlags.registerFlag(ORG, { key: 'new-ui' });
    await admin.featureFlags.enableFlag(ORG, flag.id);
    expect(seen).toEqual({ organizationId: ORG, featureFlagId: flag.id, key: 'new-ui' });
  });

  it('the identity engine and the queries layer observe the same registered user', async () => {
    const admin = createAdminConsoleRuntime();
    const user = await admin.identity.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    const found = await admin.queries.findUsers({ organizationId: ORG });
    expect(found.users.map((u) => u.id)).toContain(user.id);
  });

  it('the audit engine and the dashboard engine share the same underlying data when composed through the runtime', async () => {
    const admin = createAdminConsoleRuntime();
    await admin.audit.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    const snapshot = await admin.dashboard.generateDashboard(ORG);
    expect(snapshot.alertsSummary.auditEntryCount).toBe(1);
  });

  it('the configuration engine is independently usable from the runtime', async () => {
    const admin = createAdminConsoleRuntime();
    const entry = await admin.configuration.setRuntimeConfig(ORG, { key: 'max_upload_mb', value: 25 });
    expect(entry.value).toBe(25);
  });

  it('the settings engine is independently usable from the runtime', async () => {
    const admin = createAdminConsoleRuntime();
    const setting = await admin.settings.upsertOrganizationSetting(ORG, 'theme', 'dark');
    expect(setting.value).toBe('dark');
  });

  it('an injected institutionalMemory dep flows through to relationshipManagement.logAdminDecisionToMemory', async () => {
    const admin = createAdminConsoleRuntime({ institutionalMemory: { lifecycle: { create: async () => ({ id: 'knowledge-1' } as never) } as never } });
    const entry = await admin.relationshipManagement.logAdminDecisionToMemory(ORG, { decision: 'd', reason: 'r' });
    expect(entry).toEqual({ id: 'knowledge-1' });
  });

  it('feature flag registration and lookup round-trip through the same runtime instance', async () => {
    const admin = createAdminConsoleRuntime();
    const flag = await admin.featureFlags.registerFlag(ORG, { key: 'beta' });
    expect(await admin.featureFlags.getFlag(ORG, flag.id)).toEqual(flag);
  });

  it('an injected aiCompliance dep flows through to relationshipManagement.getComplianceFrameworkContext', async () => {
    const admin = createAdminConsoleRuntime({ aiCompliance: { queries: { findFrameworks: async () => ({ frameworks: [{ id: 'f1' } as never], total: 1 }) } as never } });
    expect(await admin.relationshipManagement.getComplianceFrameworkContext(ORG)).toEqual([{ id: 'f1' }]);
  });

  it('the tenants engine and environments are both reachable from the same runtime instance', async () => {
    const admin = createAdminConsoleRuntime();
    const tenant = await admin.tenants.createTenant(ORG, { name: 'Tenant One' });
    const environment = await admin.tenants.createEnvironment(ORG, { tenantId: tenant.id, name: 'Prod', environmentType: 'production' });
    expect(environment.tenantId).toBe(tenant.id);
  });

  it('an injected aiSecurity dep flows through to relationshipManagement.getSecurityPolicyContext', async () => {
    const admin = createAdminConsoleRuntime({ aiSecurity: { queries: { findPolicies: async () => ({ policies: [{ id: 'p1' } as never], total: 1 }) } as never } });
    expect(await admin.relationshipManagement.getSecurityPolicyContext(ORG)).toEqual([{ id: 'p1' }]);
  });

  it('the audit engine records entries visible through both direct access and the query layer', async () => {
    const admin = createAdminConsoleRuntime();
    const entry = await admin.audit.recordAudit(ORG, { actor: { id: 'u1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    const found = await admin.queries.findAudits({ organizationId: ORG });
    expect(found.audits.map((a) => a.id)).toContain(entry.id);
  });
});
