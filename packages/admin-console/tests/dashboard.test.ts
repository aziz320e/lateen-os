import { describe, expect, it } from 'vitest';
import { createAuditCenterEngine } from '../src/audit/engine.impl.js';
import { createAuditEntryRepository } from '../src/audit/repository.impl.js';
import { computeSystemStatus, createDashboardEngine } from '../src/dashboard/engine.impl.js';
import { createDashboardSnapshotRepository } from '../src/dashboard/repository.impl.js';
import { createAdminEventBus } from '../src/events/index.js';
import { createFeatureFlagEngine } from '../src/feature-flags/engine.impl.js';
import { createFeatureFlagRepository } from '../src/feature-flags/repository.impl.js';
import { createGroupRepository, createIdentityAdministrationEngine, createPermissionRepository, createRoleRepository, createUserRepository } from '../src/identity/index.js';
import { createMonitoringEngine } from '../src/monitoring/engine.impl.js';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';
import { createEnvironmentRepository, createTenantEngine, createTenantRepository } from '../src/tenants/index.js';

const ORG = 'org-1';

function setup(relationshipDeps: RelationshipManagementDeps = {}) {
  const eventBus = createAdminEventBus();
  const tenants = createTenantEngine(createTenantRepository(), createEnvironmentRepository());
  const featureFlags = createFeatureFlagEngine(createFeatureFlagRepository());
  const identity = createIdentityAdministrationEngine(createPermissionRepository(), createRoleRepository(), createGroupRepository(), createUserRepository());
  const audit = createAuditCenterEngine(createAuditEntryRepository());
  const monitoring = createMonitoringEngine(createRelationshipManagement(relationshipDeps));
  const engine = createDashboardEngine(createDashboardSnapshotRepository(), tenants, featureFlags, identity, audit, monitoring, eventBus);
  return { engine, eventBus, tenants, featureFlags, identity, audit };
}

describe('computeSystemStatus (pure)', () => {
  it('healthy when there are no checked services', () => {
    expect(computeSystemStatus(0, 0)).toBe('healthy');
  });

  it('healthy when nothing is unhealthy', () => {
    expect(computeSystemStatus(5, 0)).toBe('healthy');
  });

  it('degraded when some but not all services are unhealthy', () => {
    expect(computeSystemStatus(5, 2)).toBe('degraded');
  });

  it('unhealthy when every checked service is unhealthy', () => {
    expect(computeSystemStatus(5, 5)).toBe('unhealthy');
  });
});

describe('DashboardEngine', () => {
  it('generateDashboard() aggregates real counts from every composed engine', async () => {
    const { engine, tenants, featureFlags, identity, audit } = setup();
    await tenants.createTenant(ORG, { name: 'Tenant One' });
    await featureFlags.registerFlag(ORG, { key: 'new-ui' });
    await identity.createUser(ORG, { email: 'a@b.com', displayName: 'A B' });
    await audit.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });

    const snapshot = await engine.generateDashboard(ORG);
    expect(snapshot.kpis['tenantCount']).toBe(1);
    expect(snapshot.kpis['featureFlagCount']).toBe(1);
    expect(snapshot.kpis['userCount']).toBe(1);
    expect(snapshot.kpis['auditEntryCount']).toBe(1);
  });

  it('publishes dashboard.generated', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('dashboard.generated', (payload) => (seen = payload));
    const snapshot = await engine.generateDashboard(ORG);
    expect(seen).toEqual({ organizationId: ORG, dashboardSnapshotId: snapshot.id });
  });

  it('generateDashboard() with no data at all produces an all-zero, healthy snapshot', async () => {
    const { engine } = setup();
    const snapshot = await engine.generateDashboard(ORG);
    expect(snapshot.systemStatus).toBe('healthy');
    expect(snapshot.tenantStatus).toEqual([]);
    expect(snapshot.healthSummary).toEqual({ checkedServices: 0, unhealthyServices: 0 });
    expect(snapshot.alertsSummary).toEqual({ auditEntryCount: 0 });
  });

  it('generateDashboard() reflects tenant status summaries', async () => {
    const { engine, tenants } = setup();
    const tenant = await tenants.createTenant(ORG, { name: 'Tenant One' });
    await tenants.suspendTenant(ORG, tenant.id);
    const snapshot = await engine.generateDashboard(ORG);
    expect(snapshot.tenantStatus).toEqual([{ tenantId: tenant.id, name: 'Tenant One', status: 'suspended' }]);
  });

  it('generateDashboard() derives systemStatus from real Observability health data', async () => {
    const relationshipDeps: RelationshipManagementDeps = {
      observability: { queries: { findHealth: async () => ({ checks: [{ status: 'unhealthy' } as never], total: 1 }) } as never },
    };
    const { engine } = setup(relationshipDeps);
    const snapshot = await engine.generateDashboard(ORG);
    expect(snapshot.systemStatus).toBe('unhealthy');
    expect(snapshot.healthSummary).toEqual({ checkedServices: 1, unhealthyServices: 1 });
  });

  it('getLatestDashboard() returns the most recently generated snapshot', async () => {
    let current = '2026-01-01T00:00:00.000Z';
    const eventBus = createAdminEventBus();
    const tenants = createTenantEngine(createTenantRepository(), createEnvironmentRepository());
    const featureFlags = createFeatureFlagEngine(createFeatureFlagRepository());
    const identity = createIdentityAdministrationEngine(createPermissionRepository(), createRoleRepository(), createGroupRepository(), createUserRepository());
    const audit = createAuditCenterEngine(createAuditEntryRepository());
    const monitoring = createMonitoringEngine(createRelationshipManagement({}));
    const engine = createDashboardEngine(createDashboardSnapshotRepository(), tenants, featureFlags, identity, audit, monitoring, eventBus, () => current);

    const first = await engine.generateDashboard(ORG);
    current = '2026-01-01T00:01:00.000Z';
    const second = await engine.generateDashboard(ORG);

    const latest = await engine.getLatestDashboard(ORG);
    expect(latest?.id).toBe(second.id);
    expect(latest?.id).not.toBe(first.id);
  });

  it('getLatestDashboard() returns null when nothing has been generated', async () => {
    const { engine } = setup();
    expect(await engine.getLatestDashboard(ORG)).toBeNull();
  });

  it('getDashboard()/listDashboards() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getDashboard(ORG, 'missing')).toBeNull();
    const snapshot = await engine.generateDashboard(ORG);
    expect(await engine.getDashboard(ORG, snapshot.id)).toEqual(snapshot);
    expect(await engine.listDashboards(ORG)).toHaveLength(1);
  });

  it('dashboards are isolated per organization', async () => {
    const { engine } = setup();
    await engine.generateDashboard(ORG);
    await engine.generateDashboard('org-2');
    expect(await engine.listDashboards(ORG)).toHaveLength(1);
    expect(await engine.listDashboards('org-2')).toHaveLength(1);
  });

  it('generateDashboard() called twice produces two independent, separately-retrievable snapshots', async () => {
    const { engine } = setup();
    const first = await engine.generateDashboard(ORG);
    const second = await engine.generateDashboard(ORG);
    expect(first.id).not.toBe(second.id);
    expect(await engine.listDashboards(ORG)).toHaveLength(2);
  });

  it('generateDashboard() reflects multiple tenants with different statuses', async () => {
    const { engine, tenants } = setup();
    const tenantA = await tenants.createTenant(ORG, { name: 'Tenant A' });
    await tenants.createTenant(ORG, { name: 'Tenant B' });
    await tenants.suspendTenant(ORG, tenantA.id);
    const snapshot = await engine.generateDashboard(ORG);
    expect(snapshot.tenantStatus).toHaveLength(2);
    expect(snapshot.kpis['tenantCount']).toBe(2);
  });

  it('generateDashboard() reflects real security/governance/compliance counts sourced from monitoring', async () => {
    const relationshipDeps: RelationshipManagementDeps = {
      aiSecurity: { queries: { findPolicies: async () => ({ policies: [{ id: 'p1' } as never], total: 1 }) } as never },
      aiGovernance: { queries: { findPolicies: async () => ({ policies: [{ id: 'p1' } as never, { id: 'p2' } as never], total: 2 }) } as never },
      aiCompliance: { queries: { findFrameworks: async () => ({ frameworks: [{ id: 'f1' } as never], total: 1 }) } as never },
    };
    const { engine } = setup(relationshipDeps);
    const snapshot = await engine.generateDashboard(ORG);
    expect(snapshot.kpis['securityPolicyCount']).toBe(1);
    expect(snapshot.kpis['governancePolicyCount']).toBe(2);
    expect(snapshot.kpis['complianceFrameworkCount']).toBe(1);
  });

  it('degraded systemStatus is reachable when some but not all checks are unhealthy', async () => {
    const relationshipDeps: RelationshipManagementDeps = {
      observability: {
        queries: { findHealth: async () => ({ checks: [{ status: 'healthy' } as never, { status: 'unhealthy' } as never], total: 2 }) } as never,
      },
    };
    const { engine } = setup(relationshipDeps);
    const snapshot = await engine.generateDashboard(ORG);
    expect(snapshot.systemStatus).toBe('degraded');
  });

  it('alertsSummary reflects the organization’s own recorded audit entry count, independent of health status', async () => {
    const { engine, audit } = setup();
    await audit.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    await audit.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'logout', target: { type: 'session', id: 's1' } });
    const snapshot = await engine.generateDashboard(ORG);
    expect(snapshot.alertsSummary.auditEntryCount).toBe(2);
  });

  it('generateDashboard() reflects real feature flag counts', async () => {
    const { engine, featureFlags } = setup();
    await featureFlags.registerFlag(ORG, { key: 'flag-a' });
    await featureFlags.registerFlag(ORG, { key: 'flag-b' });
    const snapshot = await engine.generateDashboard(ORG);
    expect(snapshot.kpis['featureFlagCount']).toBe(2);
  });

  it('generateDashboard() sets generatedAt equal to createdAt/updatedAt for a freshly generated snapshot', async () => {
    const { engine } = setup();
    const snapshot = await engine.generateDashboard(ORG);
    expect(snapshot.generatedAt).toBe(snapshot.createdAt);
    expect(snapshot.generatedAt).toBe(snapshot.updatedAt);
  });

  it('generateDashboard() for two different organizations produces independent snapshots', async () => {
    const { engine, tenants } = setup();
    await tenants.createTenant('org-1', { name: 'T1' });
    const snapshotA = await engine.generateDashboard('org-1');
    const snapshotB = await engine.generateDashboard('org-2');
    expect(snapshotA.kpis['tenantCount']).toBe(1);
    expect(snapshotB.kpis['tenantCount']).toBe(0);
  });

  it('getDashboard() returns null for a snapshot id from a different organization', async () => {
    const { engine } = setup();
    const snapshot = await engine.generateDashboard(ORG);
    expect(await engine.getDashboard('org-2', snapshot.id)).toBeNull();
  });

  it('listDashboards() returns an empty array for an organization that never generated one', async () => {
    const { engine } = setup();
    expect(await engine.listDashboards(ORG)).toEqual([]);
  });

  it('kpis is a flat record — every configured count is present even when 0', async () => {
    const { engine } = setup();
    const snapshot = await engine.generateDashboard(ORG);
    expect(Object.keys(snapshot.kpis).sort()).toEqual(
      ['analyticsKpiCount', 'auditEntryCount', 'complianceFrameworkCount', 'featureFlagCount', 'governancePolicyCount', 'securityPolicyCount', 'tenantCount', 'userCount'].sort(),
    );
  });
});
