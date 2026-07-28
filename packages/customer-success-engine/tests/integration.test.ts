import { describe, expect, it } from 'vitest';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createProjectRuntime } from '@lateen-os/project-management-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createCustomerSuccessRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('Customer Success Engine — real integration with the seven public collaborator APIs', () => {
  it('relationships.getCustomerContext() reflects a real CRM Engine customer', async () => {
    const crm = createCrmRuntime();
    const customer = await crm.customers.create(ORG, { name: 'Acme Retail Co' });

    const cse = createCustomerSuccessRuntime({ crm });
    const context = await cse.relationships.getCustomerContext(ORG, customer.id);

    expect(context?.name).toBe('Acme Retail Co');
  });

  it('relationships.getOpportunityContext() reflects a real Sales Engine opportunity', async () => {
    const sales = createSalesRuntime();
    const opportunity = await sales.opportunities.create(ORG, { name: 'Expansion Deal', amount: '15000.00', currency: 'USD' });

    const cse = createCustomerSuccessRuntime({ sales });
    const context = await cse.relationships.getOpportunityContext(ORG, opportunity.id);

    expect(context?.name).toBe('Expansion Deal');
  });

  it('relationships.getCustomerProjectsContext() reflects real Project Management Engine projects linked to a customer', async () => {
    const projects = createProjectRuntime();
    await projects.projects.create(ORG, { code: 'PRJ-1', name: 'Onboarding Rollout', customerId: 'customer-1' });
    await projects.projects.create(ORG, { code: 'PRJ-2', name: 'Unrelated', customerId: 'customer-2' });

    const cse = createCustomerSuccessRuntime({ projects });
    const context = await cse.relationships.getCustomerProjectsContext(ORG, 'customer-1');

    expect(context).toHaveLength(1);
    expect(context[0]?.name).toBe('Onboarding Rollout');
  });

  it('relationships.notifyCustomerSuccessEvent() sends a real Communication Hub notification', async () => {
    const communicationHub = createCommunicationRuntime();
    const cse = createCustomerSuccessRuntime({ communicationHub });

    const notification = await cse.relationships.notifyCustomerSuccessEvent(ORG, { title: 'Health score dropped', body: 'Customer at risk' });

    expect(notification).not.toBeNull();
    expect(notification!.notificationType).toBe('escalation');

    const found = await communicationHub.queries.findNotifications({ organizationId: ORG });
    expect(found.notifications.some((n) => n.id === notification!.id)).toBe(true);
  });

  it('relationships.recordCustomerSuccessMetric() records a real Analytics Engine gauge metric snapshot', async () => {
    const analytics = createAnalyticsRuntime();
    const cse = createCustomerSuccessRuntime({ analytics });

    const metric = await cse.relationships.recordCustomerSuccessMetric(ORG, { metricName: 'customer.health_score', value: 82 });

    expect(metric).not.toBeNull();
    expect(metric!.metricName).toBe('customer.health_score');
    expect(metric!.value).toBe(82);
  });

  it('relationships.getBusinessProfileContext() reads a real Business DNA business profile', async () => {
    const businessDna = createBusinessDnaRuntime();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme Success Co',
      legalEntity: { legalName: 'Acme Success Co Ltd.', jurisdiction: 'US-DE' },
    });

    const cse = createCustomerSuccessRuntime({ businessDna });
    const profile = await cse.relationships.getBusinessProfileContext(ORG);

    expect(profile?.displayName).toBe('Acme Success Co');
  });

  it('relationships.logCustomerSuccessDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const cse = createCustomerSuccessRuntime({ institutionalMemory });

    const entry = await cse.relationships.logCustomerSuccessDecisionToMemory(ORG, {
      decision: 'Escalated account to senior CSM',
      reason: 'health score dropped below 25 for two consecutive snapshots',
    });
    expect(entry).not.toBeNull();

    const found = await institutionalMemory.queries.findKnowledge({ organizationId: ORG });
    expect(found.entries.some((e) => e.id === entry!.id)).toBe(true);
  });

  it('relationships.getCustomerProjectsContext() returns an empty array when Project Management Engine has no projects for that customer', async () => {
    const projects = createProjectRuntime();
    await projects.projects.create(ORG, { code: 'PRJ-3', name: 'Someone Else', customerId: 'other-customer' });

    const cse = createCustomerSuccessRuntime({ projects });
    const context = await cse.relationships.getCustomerProjectsContext(ORG, 'customer-1');

    expect(context).toEqual([]);
  });

  it('a single createCustomerSuccessRuntime() wires all seven real collaborators together at once', async () => {
    const crm = createCrmRuntime();
    const sales = createSalesRuntime();
    const projects = createProjectRuntime();
    const communicationHub = createCommunicationRuntime();
    const analytics = createAnalyticsRuntime();
    const businessDna = createBusinessDnaRuntime();
    const institutionalMemory = createInstitutionalMemoryRuntime();

    const cse = createCustomerSuccessRuntime({ crm, sales, projects, communicationHub, analytics, businessDna, institutionalMemory });

    expect(await cse.relationships.getCustomerContext(ORG, 'missing')).toBeNull();
    expect(await cse.relationships.getOpportunityContext(ORG, 'missing')).toBeNull();
    expect(await cse.relationships.getCustomerProjectsContext(ORG, 'missing-customer')).toEqual([]);

    const metric = await cse.relationships.recordCustomerSuccessMetric(ORG, { metricName: 'customer.smoke_test', value: 1 });
    expect(metric).not.toBeNull();
  });
});
