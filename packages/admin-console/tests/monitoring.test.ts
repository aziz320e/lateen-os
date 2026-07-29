import { describe, expect, it } from 'vitest';
import { createMonitoringEngine } from '../src/monitoring/engine.impl.js';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';

const ORG = 'org-1';

describe('MonitoringEngine — fully offline (no collaborators injected)', () => {
  it('every count is 0 when no collaborator is injected', async () => {
    const relationships = createRelationshipManagement({});
    const monitoring = createMonitoringEngine(relationships);
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot).toEqual({
      observabilityHealthCheckCount: 0,
      unhealthyObservabilityCheckCount: 0,
      analyticsKpiCount: 0,
      securityPolicyCount: 0,
      governancePolicyCount: 0,
      complianceFrameworkCount: 0,
    });
  });
});

describe('MonitoringEngine — with injected collaborators', () => {
  it('aggregates real health check counts, distinguishing healthy from unhealthy', async () => {
    const deps: RelationshipManagementDeps = {
      observability: {
        queries: {
          findHealth: async () => ({
            checks: [{ status: 'healthy' } as never, { status: 'unhealthy' } as never, { status: 'degraded' } as never],
            total: 3,
          }),
        } as never,
      },
    };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.observabilityHealthCheckCount).toBe(3);
    expect(snapshot.unhealthyObservabilityCheckCount).toBe(2);
  });

  it('aggregates real analytics KPI counts', async () => {
    const deps: RelationshipManagementDeps = {
      analytics: { queries: { findKPIs: async () => ({ kpis: [{ id: 'kpi-1' } as never, { id: 'kpi-2' } as never], total: 2 }) } as never },
    };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.analyticsKpiCount).toBe(2);
  });

  it('aggregates real security/governance/compliance policy and framework counts', async () => {
    const deps: RelationshipManagementDeps = {
      aiSecurity: { queries: { findPolicies: async () => ({ policies: [{ id: 'p1' } as never], total: 1 }) } as never },
      aiGovernance: { queries: { findPolicies: async () => ({ policies: [{ id: 'p1' } as never, { id: 'p2' } as never], total: 2 }) } as never },
      aiCompliance: { queries: { findFrameworks: async () => ({ frameworks: [{ id: 'f1' } as never], total: 1 }) } as never },
    };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.securityPolicyCount).toBe(1);
    expect(snapshot.governancePolicyCount).toBe(2);
    expect(snapshot.complianceFrameworkCount).toBe(1);
  });

  it('an empty health check list produces 0 unhealthy, never a division error', async () => {
    const deps: RelationshipManagementDeps = { observability: { queries: { findHealth: async () => ({ checks: [], total: 0 }) } as never } };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.observabilityHealthCheckCount).toBe(0);
    expect(snapshot.unhealthyObservabilityCheckCount).toBe(0);
  });

  it('all checks healthy produces 0 unhealthy count', async () => {
    const deps: RelationshipManagementDeps = {
      observability: { queries: { findHealth: async () => ({ checks: [{ status: 'healthy' } as never, { status: 'healthy' } as never], total: 2 }) } as never },
    };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.unhealthyObservabilityCheckCount).toBe(0);
  });

  it('degraded checks are counted as unhealthy, not as a separate bucket', async () => {
    const deps: RelationshipManagementDeps = {
      observability: { queries: { findHealth: async () => ({ checks: [{ status: 'degraded' } as never], total: 1 }) } as never },
    };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.unhealthyObservabilityCheckCount).toBe(1);
  });

  it('getSystemMonitoringSnapshot() is a pure read — it never mutates anything in the sibling collaborators', async () => {
    const findHealthCalls: unknown[] = [];
    const deps: RelationshipManagementDeps = {
      observability: {
        queries: {
          findHealth: async (query: unknown) => {
            findHealthCalls.push(query);
            return { checks: [], total: 0 };
          },
        } as never,
      },
    };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(findHealthCalls).toEqual([{ organizationId: ORG }]);
  });

  it('getSystemMonitoringSnapshot() queries all five collaborators for the same organizationId', async () => {
    const calls: string[] = [];
    const deps: RelationshipManagementDeps = {
      observability: { queries: { findHealth: async (q: { organizationId: string }) => { calls.push(q.organizationId); return { checks: [], total: 0 }; } } as never },
      analytics: { queries: { findKPIs: async (q: { organizationId: string }) => { calls.push(q.organizationId); return { kpis: [], total: 0 }; } } as never },
    };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(calls).toEqual([ORG, ORG]);
  });

  it('a mix of healthy, degraded, and unhealthy checks counts only the non-healthy ones as unhealthy', async () => {
    const deps: RelationshipManagementDeps = {
      observability: {
        queries: {
          findHealth: async () => ({
            checks: [{ status: 'healthy' } as never, { status: 'healthy' } as never, { status: 'degraded' } as never, { status: 'unhealthy' } as never],
            total: 4,
          }),
        } as never,
      },
    };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.observabilityHealthCheckCount).toBe(4);
    expect(snapshot.unhealthyObservabilityCheckCount).toBe(2);
  });

  it('only security is injected — every other count stays 0', async () => {
    const deps: RelationshipManagementDeps = { aiSecurity: { queries: { findPolicies: async () => ({ policies: [{ id: 'p1' } as never], total: 1 }) } as never } };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.securityPolicyCount).toBe(1);
    expect(snapshot.governancePolicyCount).toBe(0);
    expect(snapshot.complianceFrameworkCount).toBe(0);
    expect(snapshot.analyticsKpiCount).toBe(0);
  });

  it('only compliance is injected — every other count stays 0', async () => {
    const deps: RelationshipManagementDeps = { aiCompliance: { queries: { findFrameworks: async () => ({ frameworks: [{ id: 'f1' } as never], total: 1 }) } as never } };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.complianceFrameworkCount).toBe(1);
    expect(snapshot.securityPolicyCount).toBe(0);
  });

  it('only observability is injected — snapshot is otherwise all zero', async () => {
    const deps: RelationshipManagementDeps = {
      observability: { queries: { findHealth: async () => ({ checks: [{ status: 'healthy' } as never], total: 1 }) } as never },
    };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.observabilityHealthCheckCount).toBe(1);
    expect(snapshot.analyticsKpiCount).toBe(0);
    expect(snapshot.securityPolicyCount).toBe(0);
    expect(snapshot.governancePolicyCount).toBe(0);
    expect(snapshot.complianceFrameworkCount).toBe(0);
  });

  it('returns a fresh snapshot object on every call — never a cached reference', async () => {
    const monitoring = createMonitoringEngine(createRelationshipManagement({}));
    const first = await monitoring.getSystemMonitoringSnapshot(ORG);
    const second = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });

  it('only governance is injected — every other count stays 0', async () => {
    const deps: RelationshipManagementDeps = { aiGovernance: { queries: { findPolicies: async () => ({ policies: [{ id: 'p1' } as never], total: 1 }) } as never } };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.governancePolicyCount).toBe(1);
    expect(snapshot.securityPolicyCount).toBe(0);
    expect(snapshot.complianceFrameworkCount).toBe(0);
  });

  it('only analytics is injected — every other count stays 0', async () => {
    const deps: RelationshipManagementDeps = { analytics: { queries: { findKPIs: async () => ({ kpis: [{ id: 'kpi-1' } as never, { id: 'kpi-2' } as never], total: 2 }) } as never } };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.analyticsKpiCount).toBe(2);
    expect(snapshot.observabilityHealthCheckCount).toBe(0);
  });

  it('composes all five monitoring collaborators together at once', async () => {
    const deps: RelationshipManagementDeps = {
      observability: { queries: { findHealth: async () => ({ checks: [{ status: 'healthy' } as never], total: 1 }) } as never },
      analytics: { queries: { findKPIs: async () => ({ kpis: [{ id: 'kpi-1' } as never], total: 1 }) } as never },
      aiSecurity: { queries: { findPolicies: async () => ({ policies: [], total: 0 }) } as never },
      aiGovernance: { queries: { findPolicies: async () => ({ policies: [], total: 0 }) } as never },
      aiCompliance: { queries: { findFrameworks: async () => ({ frameworks: [], total: 0 }) } as never },
    };
    const monitoring = createMonitoringEngine(createRelationshipManagement(deps));
    const snapshot = await monitoring.getSystemMonitoringSnapshot(ORG);
    expect(snapshot.observabilityHealthCheckCount).toBe(1);
    expect(snapshot.analyticsKpiCount).toBe(1);
  });
});
