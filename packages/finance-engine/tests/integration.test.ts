import { describe, expect, it } from 'vitest';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createFinanceRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('Finance Engine — real integration with the seven public collaborator APIs', () => {
  it('relationships.getCustomerContext() reflects a real CRM Engine customer', async () => {
    const crm = createCrmRuntime();
    const customer = await crm.customers.create(ORG, { name: 'Acme Corp' });

    const finance = createFinanceRuntime({ crm });
    const context = await finance.relationships.getCustomerContext(ORG, customer.id);

    expect(context?.name).toBe('Acme Corp');
  });

  it('relationships.getOpportunityContext() reflects a real Sales Engine opportunity', async () => {
    const sales = createSalesRuntime();
    const opportunity = await sales.opportunities.create(ORG, { name: 'Big Deal', amount: '25000.00', currency: 'USD' });

    const finance = createFinanceRuntime({ sales });
    const context = await finance.relationships.getOpportunityContext(ORG, opportunity.id);

    expect(context?.amount).toBe('25000.00');
  });

  it('relationships.getBusinessProfileContext() reads a real Business DNA business profile', async () => {
    const businessDna = createBusinessDnaRuntime();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme Manufacturing',
      legalEntity: { legalName: 'Acme Manufacturing Ltd.', jurisdiction: 'US-DE' },
    });

    const finance = createFinanceRuntime({ businessDna });
    const profile = await finance.relationships.getBusinessProfileContext(ORG);

    expect(profile?.displayName).toBe('Acme Manufacturing');
  });

  it('relationships.raiseFinanceApprovalWorkflow() starts a real Workflow Engine instance', async () => {
    const workflow = createWorkflowRuntime();
    const finance = createFinanceRuntime({ workflow });

    const raised = await finance.relationships.raiseFinanceApprovalWorkflow(ORG, { requestType: 'invoice_approval', notes: 'over threshold' });
    expect(raised).not.toBeNull();

    const found = await workflow.queries.findWorkflow({ organizationId: ORG, definitionId: raised!.workflowDefinitionId });
    expect(found.definition).not.toBeNull();
  });

  it('relationships.notifyFinanceEvent() sends a real Communication Hub notification', async () => {
    const communicationHub = createCommunicationRuntime();
    const finance = createFinanceRuntime({ communicationHub });

    const notification = await finance.relationships.notifyFinanceEvent(ORG, { title: 'Invoice overdue', body: '30 days past due' });

    expect(notification).not.toBeNull();
    expect(notification!.notificationType).toBe('escalation');

    const found = await communicationHub.queries.findNotifications({ organizationId: ORG });
    expect(found.notifications.some((n) => n.id === notification!.id)).toBe(true);
  });

  it('relationships.recordRevenueKpi() records a real Analytics Engine KPI snapshot', async () => {
    const analytics = createAnalyticsRuntime();
    const finance = createFinanceRuntime({ analytics });

    const kpi = await finance.relationships.recordRevenueKpi(ORG, { value: 150000 });

    expect(kpi).not.toBeNull();
    expect(kpi!.kpiType).toBe('revenue');
    expect(kpi!.value).toBe(150000);
  });

  it('relationships.logFinanceDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const finance = createFinanceRuntime({ institutionalMemory });

    const entry = await finance.relationships.logFinanceDecisionToMemory(ORG, { decision: 'Closed FY2025 books', reason: 'year-end close completed' });
    expect(entry).not.toBeNull();

    const found = await institutionalMemory.queries.findKnowledge({ organizationId: ORG });
    expect(found.entries.some((e) => e.id === entry!.id)).toBe(true);
  });

  it('a single createFinanceRuntime() wires all seven real collaborators together at once', async () => {
    const crm = createCrmRuntime();
    const sales = createSalesRuntime();
    const businessDna = createBusinessDnaRuntime();
    const workflow = createWorkflowRuntime();
    const communicationHub = createCommunicationRuntime();
    const analytics = createAnalyticsRuntime();
    const institutionalMemory = createInstitutionalMemoryRuntime();

    const finance = createFinanceRuntime({ crm, sales, businessDna, workflow, communicationHub, analytics, institutionalMemory });

    expect(await finance.relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await finance.relationships.getCustomerContext(ORG, 'missing')).toBeNull();

    const raised = await finance.relationships.raiseFinanceApprovalWorkflow(ORG, { requestType: 'smoke_test' });
    expect(raised).not.toBeNull();

    const kpi = await finance.relationships.recordRevenueKpi(ORG, { value: 42 });
    expect(kpi).not.toBeNull();
  });
});
