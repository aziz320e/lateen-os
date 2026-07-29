/**
 * Real System Monitoring engine — a pure aggregation over the
 * Relationship Layer's Observability, Analytics, Security, Governance,
 * and Compliance methods. This module owns no repository and
 * implements no health/alerting/scoring logic of its own — it never
 * duplicates monitoring logic already owned by those sibling packages.
 *
 * @module monitoring/engine.impl
 */
import type { RelationshipManagement } from '../relationship-management/service.impl.js';
import type { OrganizationId } from '../shared/identifiers.js';

export interface SystemMonitoringSnapshot {
  readonly observabilityHealthCheckCount: number;
  readonly unhealthyObservabilityCheckCount: number;
  readonly analyticsKpiCount: number;
  readonly securityPolicyCount: number;
  readonly governancePolicyCount: number;
  readonly complianceFrameworkCount: number;
}

export interface MonitoringEngine {
  getSystemMonitoringSnapshot(organizationId: OrganizationId): Promise<SystemMonitoringSnapshot>;
}

type MonitoringRelationships = Pick<
  RelationshipManagement,
  'getObservabilityHealthContext' | 'getAnalyticsSnapshotContext' | 'getSecurityPolicyContext' | 'getGovernancePolicyContext' | 'getComplianceFrameworkContext'
>;

/** Creates a real {@link MonitoringEngine}, composed entirely over the Relationship Layer. */
export function createMonitoringEngine(relationships: MonitoringRelationships): MonitoringEngine {
  return {
    async getSystemMonitoringSnapshot(organizationId) {
      const [healthChecks, kpis, securityPolicies, governancePolicies, complianceFrameworks] = await Promise.all([
        relationships.getObservabilityHealthContext(organizationId),
        relationships.getAnalyticsSnapshotContext(organizationId),
        relationships.getSecurityPolicyContext(organizationId),
        relationships.getGovernancePolicyContext(organizationId),
        relationships.getComplianceFrameworkContext(organizationId),
      ]);

      return {
        observabilityHealthCheckCount: healthChecks.length,
        unhealthyObservabilityCheckCount: healthChecks.filter((check) => check.status !== 'healthy').length,
        analyticsKpiCount: kpis.length,
        securityPolicyCount: securityPolicies.length,
        governancePolicyCount: governancePolicies.length,
        complianceFrameworkCount: complianceFrameworks.length,
      };
    },
  };
}
