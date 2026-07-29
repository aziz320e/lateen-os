import { describe, expect, it } from 'vitest';
import { createComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import { createGovernanceRuntime } from '@lateen-os/ai-governance-engine';
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createApiGatewayRuntime } from '@lateen-os/api-gateway';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createObservabilityRuntime } from '@lateen-os/observability-engine';
import { createAdminConsoleRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('Admin Console — real integration with all 9 public collaborator APIs', () => {
  it('relationshipManagement.getApiGatewayContext() reflects a real API Gateway registered API', async () => {
    const apiGateway = createApiGatewayRuntime();
    await apiGateway.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });

    const admin = createAdminConsoleRuntime({ apiGateway });
    const context = await admin.relationshipManagement.getApiGatewayContext(ORG);

    expect(context.some((api) => api.code === 'crm')).toBe(true);
  });

  it('relationshipManagement.getObservabilityHealthContext() reflects a real Observability Engine health check', async () => {
    const observability = createObservabilityRuntime();
    await observability.health.checkComponentHealth(ORG, 'admin-console', 'healthy');

    const admin = createAdminConsoleRuntime({ observability });
    const context = await admin.relationshipManagement.getObservabilityHealthContext(ORG);

    expect(context.some((check) => check.component === 'admin-console')).toBe(true);
  });

  it('relationshipManagement.getAnalyticsSnapshotContext() reflects a real Analytics Engine KPI snapshot', async () => {
    const analytics = createAnalyticsRuntime();
    await analytics.kpis.recordRevenue(ORG, { value: 100000 });

    const admin = createAdminConsoleRuntime({ analytics });
    const context = await admin.relationshipManagement.getAnalyticsSnapshotContext(ORG);

    expect(context.length).toBeGreaterThan(0);
  });

  it('relationshipManagement.getSecurityPolicyContext() reflects a real AI Security Engine policy', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authorization.createPolicy(ORG, { name: 'Deny External Calls', policyType: 'custom', effect: 'deny', rules: [] });

    const admin = createAdminConsoleRuntime({ aiSecurity });
    const context = await admin.relationshipManagement.getSecurityPolicyContext(ORG);

    expect(context.some((policy) => policy.name === 'Deny External Calls')).toBe(true);
  });

  it('relationshipManagement.getGovernancePolicyContext() reflects a real AI Governance Engine policy', async () => {
    const aiGovernance = createGovernanceRuntime();
    await aiGovernance.policies.create(ORG, { name: 'Model Review Policy', policyType: 'ai' });

    const admin = createAdminConsoleRuntime({ aiGovernance });
    const context = await admin.relationshipManagement.getGovernancePolicyContext(ORG);

    expect(context.some((policy) => policy.name === 'Model Review Policy')).toBe(true);
  });

  it('relationshipManagement.getComplianceFrameworkContext() reflects a real AI Compliance Engine framework', async () => {
    const aiCompliance = createComplianceRuntime();
    await aiCompliance.frameworks.create(ORG, { frameworkCode: 'GDPR', name: 'GDPR Framework' });

    const admin = createAdminConsoleRuntime({ aiCompliance });
    const context = await admin.relationshipManagement.getComplianceFrameworkContext(ORG);

    expect(context.some((framework) => framework.frameworkCode === 'GDPR')).toBe(true);
  });

  it('relationshipManagement.getBusinessProfileContext() reads a real Business DNA business profile', async () => {
    const businessDna = createBusinessDnaRuntime();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme Admin Co',
      legalEntity: { legalName: 'Acme Admin Co Ltd.', jurisdiction: 'US-DE' },
    });

    const admin = createAdminConsoleRuntime({ businessDna });
    const profile = await admin.relationshipManagement.getBusinessProfileContext(ORG);

    expect(profile?.displayName).toBe('Acme Admin Co');
  });

  it('relationshipManagement.logAdminDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const admin = createAdminConsoleRuntime({ institutionalMemory });

    const entry = await admin.relationshipManagement.logAdminDecisionToMemory(ORG, {
      decision: 'Suspended tenant "acme-staging"',
      reason: 'repeated billing failures over 90 days',
    });
    expect(entry).not.toBeNull();

    const found = await institutionalMemory.queries.findKnowledge({ organizationId: ORG });
    expect(found.entries.some((e) => e.id === entry!.id)).toBe(true);
  });

  it('relationshipManagement.notifyAdminEvent() sends a real Communication Hub notification', async () => {
    const communicationHub = createCommunicationRuntime();
    const admin = createAdminConsoleRuntime({ communicationHub });

    const notification = await admin.relationshipManagement.notifyAdminEvent(ORG, { title: 'Tenant suspended', body: 'Billing failure' });
    expect(notification).not.toBeNull();
    expect(notification!.notificationType).toBe('escalation');

    const found = await communicationHub.queries.findNotifications({ organizationId: ORG });
    expect(found.notifications.some((n) => n.id === notification!.id)).toBe(true);
  });

  it('a single createAdminConsoleRuntime() wires all 9 real collaborators together at once', async () => {
    const apiGateway = createApiGatewayRuntime();
    const observability = createObservabilityRuntime();
    const analytics = createAnalyticsRuntime();
    const aiSecurity = createSecurityRuntime();
    const aiGovernance = createGovernanceRuntime();
    const aiCompliance = createComplianceRuntime();
    const businessDna = createBusinessDnaRuntime();
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const communicationHub = createCommunicationRuntime();

    const admin = createAdminConsoleRuntime({
      apiGateway,
      observability,
      analytics,
      aiSecurity,
      aiGovernance,
      aiCompliance,
      businessDna,
      institutionalMemory,
      communicationHub,
    });

    expect(await admin.relationshipManagement.getApiGatewayContext(ORG)).toEqual([]);
    expect(await admin.relationshipManagement.getBusinessProfileContext(ORG)).toBeNull();

    const notification = await admin.relationshipManagement.notifyAdminEvent(ORG, { title: 'Smoke test' });
    expect(notification).not.toBeNull();
  });

  it('relationshipManagement.getApiGatewayContext() is unaffected by apis registered against a different real API Gateway instance', async () => {
    const apiGateway = createApiGatewayRuntime();
    await apiGateway.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });

    const otherApiGateway = createApiGatewayRuntime();
    const admin = createAdminConsoleRuntime({ apiGateway: otherApiGateway });

    expect(await admin.relationshipManagement.getApiGatewayContext(ORG)).toEqual([]);
  });

  it('the Admin Console dispatches admin-recorded audit entries independently of any sibling runtime', async () => {
    const observability = createObservabilityRuntime();
    const admin = createAdminConsoleRuntime({ observability });

    const entry = await admin.audit.recordAudit(ORG, { actor: { id: 'admin-1', type: 'user' }, action: 'tenant.suspended', target: { type: 'tenant', id: 'tenant-1' } });
    expect(entry).not.toBeNull();

    const found = await admin.queries.findAudits({ organizationId: ORG });
    expect(found.audits.some((a) => a.id === entry.id)).toBe(true);
  });

  it('relationshipManagement.getSecurityPolicyContext() reflects only active real AI Security Engine policies for the given organization', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authorization.createPolicy(ORG, { name: 'Org Policy', policyType: 'custom', effect: 'allow', rules: [] });
    await aiSecurity.authorization.createPolicy('org-2', { name: 'Other Org Policy', policyType: 'custom', effect: 'allow', rules: [] });

    const admin = createAdminConsoleRuntime({ aiSecurity });
    const context = await admin.relationshipManagement.getSecurityPolicyContext(ORG);

    expect(context.some((policy) => policy.name === 'Org Policy')).toBe(true);
    expect(context.some((policy) => policy.name === 'Other Org Policy')).toBe(false);
  });

  it('relationshipManagement.notifyAdminEvent() and Communication Hub’s own query layer agree on the sent notification', async () => {
    const communicationHub = createCommunicationRuntime();
    const admin = createAdminConsoleRuntime({ communicationHub });

    const notification = await admin.relationshipManagement.notifyAdminEvent(ORG, { title: 'Feature flag toggled' });
    const found = await communicationHub.queries.findNotifications({ organizationId: ORG });

    expect(found.notifications.map((n) => n.id)).toContain(notification!.id);
  });

  it('relationshipManagement.getGovernancePolicyContext() reflects only that organization’s real AI Governance Engine policies', async () => {
    const aiGovernance = createGovernanceRuntime();
    await aiGovernance.policies.create(ORG, { name: 'Org Policy', policyType: 'ai' });
    await aiGovernance.policies.create('org-2', { name: 'Other Org Policy', policyType: 'ai' });

    const admin = createAdminConsoleRuntime({ aiGovernance });
    const context = await admin.relationshipManagement.getGovernancePolicyContext(ORG);

    expect(context.map((policy) => policy.name)).toEqual(['Org Policy']);
  });

  it('the dashboard generated through the runtime persists and is retrievable via the query layer', async () => {
    const observability = createObservabilityRuntime();
    const admin = createAdminConsoleRuntime({ observability });
    const generated = await admin.dashboard.generateDashboard(ORG);
    const found = await admin.queries.findDashboard({ organizationId: ORG });
    expect(found.dashboard?.id).toBe(generated.id);
  });

  it('the Administration Dashboard aggregates a real System Monitoring snapshot sourced from real siblings', async () => {
    const observability = createObservabilityRuntime();
    await observability.health.checkComponentHealth(ORG, 'admin-console', 'unhealthy');
    const analytics = createAnalyticsRuntime();
    await analytics.kpis.recordRevenue(ORG, { value: 5000 });

    const admin = createAdminConsoleRuntime({ observability, analytics });
    const snapshot = await admin.dashboard.generateDashboard(ORG);

    expect(snapshot.systemStatus).toBe('unhealthy');
    expect(snapshot.healthSummary).toEqual({ checkedServices: 1, unhealthyServices: 1 });
    expect(snapshot.kpis['analyticsKpiCount']).toBeGreaterThan(0);
  });
});
