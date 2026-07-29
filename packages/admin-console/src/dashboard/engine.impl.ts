/**
 * Real Administration Dashboard engine — composed intra-package with
 * the Organization, Tenant, Feature Flag, Identity, and Audit engines
 * plus the System Monitoring engine (itself composed over the
 * Relationship Layer). Every KPI/status number here is real,
 * currently-stored data — never a placeholder or sampled estimate.
 *
 * @module dashboard/engine.impl
 */
import type { AuditCenterEngine } from '../audit/engine.impl.js';
import type { AdminEventBus } from '../events/admin-event-bus.js';
import type { FeatureFlagEngine } from '../feature-flags/engine.impl.js';
import type { IdentityAdministrationEngine } from '../identity/engine.impl.js';
import type { MonitoringEngine } from '../monitoring/engine.impl.js';
import { generateId, nowIso } from '../shared/id.js';
import type { DashboardSnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { TenantEngine } from '../tenants/engine.impl.js';
import type { DashboardSnapshotRepository } from './repository.js';
import type { DashboardSnapshot, SystemStatus } from './types.js';

/** Fixed banding over the ratio of unhealthy to checked services — never a heuristic. */
export function computeSystemStatus(checkedServices: number, unhealthyServices: number): SystemStatus {
  if (checkedServices === 0 || unhealthyServices === 0) return 'healthy';
  if (unhealthyServices >= checkedServices) return 'unhealthy';
  return 'degraded';
}

export interface DashboardEngine {
  generateDashboard(organizationId: OrganizationId): Promise<DashboardSnapshot>;
  getLatestDashboard(organizationId: OrganizationId): Promise<DashboardSnapshot | null>;
  getDashboard(organizationId: OrganizationId, dashboardSnapshotId: DashboardSnapshotId): Promise<DashboardSnapshot | null>;
  listDashboards(organizationId: OrganizationId): Promise<readonly DashboardSnapshot[]>;
}

/** Creates a real {@link DashboardEngine}. */
export function createDashboardEngine(
  repository: DashboardSnapshotRepository,
  tenants: Pick<TenantEngine, 'listTenants'>,
  featureFlags: Pick<FeatureFlagEngine, 'listFlags'>,
  identity: Pick<IdentityAdministrationEngine, 'listUsers'>,
  audit: Pick<AuditCenterEngine, 'listAudits'>,
  monitoring: Pick<MonitoringEngine, 'getSystemMonitoringSnapshot'>,
  eventBus?: AdminEventBus,
  now: () => string = nowIso,
): DashboardEngine {
  return {
    async generateDashboard(organizationId) {
      const [tenantList, flags, users, auditEntries, monitoringSnapshot] = await Promise.all([
        tenants.listTenants(organizationId),
        featureFlags.listFlags(organizationId),
        identity.listUsers(organizationId),
        audit.listAudits(organizationId),
        monitoring.getSystemMonitoringSnapshot(organizationId),
      ]);

      const timestamp = now();
      const snapshot: DashboardSnapshot = {
        id: generateId('admin-dashboard'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        kpis: {
          tenantCount: tenantList.length,
          featureFlagCount: flags.length,
          userCount: users.length,
          auditEntryCount: auditEntries.length,
          analyticsKpiCount: monitoringSnapshot.analyticsKpiCount,
          securityPolicyCount: monitoringSnapshot.securityPolicyCount,
          governancePolicyCount: monitoringSnapshot.governancePolicyCount,
          complianceFrameworkCount: monitoringSnapshot.complianceFrameworkCount,
        },
        systemStatus: computeSystemStatus(monitoringSnapshot.observabilityHealthCheckCount, monitoringSnapshot.unhealthyObservabilityCheckCount),
        tenantStatus: tenantList.map((tenant) => ({ tenantId: tenant.id, name: tenant.name, status: tenant.status })),
        healthSummary: {
          checkedServices: monitoringSnapshot.observabilityHealthCheckCount,
          unhealthyServices: monitoringSnapshot.unhealthyObservabilityCheckCount,
        },
        alertsSummary: {
          auditEntryCount: auditEntries.length,
        },
        generatedAt: timestamp,
      };

      await repository.save(snapshot);
      eventBus?.publish('dashboard.generated', { organizationId, dashboardSnapshotId: snapshot.id });
      return snapshot;
    },

    async getLatestDashboard(organizationId) {
      const all = await repository.findAll(organizationId);
      if (all.length === 0) return null;
      return all.reduce((latest, candidate) => (candidate.generatedAt >= latest.generatedAt ? candidate : latest));
    },

    async getDashboard(organizationId, dashboardSnapshotId) {
      return repository.findById(organizationId, dashboardSnapshotId);
    },

    async listDashboards(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
