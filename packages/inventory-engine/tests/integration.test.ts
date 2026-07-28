import { describe, expect, it } from 'vitest';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createFinanceRuntime } from '@lateen-os/finance-engine';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createInventoryRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('Inventory Engine — real integration with the seven public collaborator APIs', () => {
  it('relationships.getProductContext() reflects a real Business DNA catalog product', async () => {
    const businessDna = createBusinessDnaRuntime();
    const product = await businessDna.products.createProduct(ORG, {
      code: 'PROD-1',
      name: 'Vinyl Banner',
      category: 'signage',
      productionType: 'print_only',
      unitOfMeasure: 'each',
      currency: 'USD',
    });

    const inventory = createInventoryRuntime({ businessDna });
    const context = await inventory.relationships.getProductContext(ORG, product.id);

    expect(context?.name).toBe('Vinyl Banner');
  });

  it('relationships.getOpportunityContext() reflects a real Sales Engine opportunity', async () => {
    const sales = createSalesRuntime();
    const opportunity = await sales.opportunities.create(ORG, { name: 'Big Deal', amount: '25000.00', currency: 'USD' });

    const inventory = createInventoryRuntime({ sales });
    const context = await inventory.relationships.getOpportunityContext(ORG, opportunity.id);

    expect(context?.amount).toBe('25000.00');
  });

  it('relationships.recordInventoryValuationEntry() composes a real, posted Finance Engine journal entry', async () => {
    const finance = createFinanceRuntime();
    const inventoryAccount = await finance.chartOfAccounts.create(ORG, { code: '1200', name: 'Inventory', accountType: 'asset' });
    const cogsAccount = await finance.chartOfAccounts.create(ORG, { code: '5000', name: 'COGS', accountType: 'expense' });

    const inventory = createInventoryRuntime({ finance });
    const entry = await inventory.relationships.recordInventoryValuationEntry(ORG, {
      inventoryAccountId: inventoryAccount.id,
      offsetAccountId: cogsAccount.id,
      amount: '500.00',
      currency: 'USD',
      entryDate: '2026-01-15',
    });

    expect(entry).not.toBeNull();
    expect(entry!.status).toBe('posted');

    const found = await finance.generalLedger.getJournalEntry(ORG, entry!.id);
    expect(found?.status).toBe('posted');
  });

  it('relationships.raiseInventoryApprovalWorkflow() starts a real Workflow Engine instance', async () => {
    const workflow = createWorkflowRuntime();
    const inventory = createInventoryRuntime({ workflow });

    const raised = await inventory.relationships.raiseInventoryApprovalWorkflow(ORG, { requestType: 'purchase_approval', notes: 'urgent reorder' });
    expect(raised).not.toBeNull();

    const found = await workflow.queries.findWorkflow({ organizationId: ORG, definitionId: raised!.workflowDefinitionId });
    expect(found.definition).not.toBeNull();
  });

  it('relationships.notifyInventoryEvent() sends a real Communication Hub notification', async () => {
    const communicationHub = createCommunicationRuntime();
    const inventory = createInventoryRuntime({ communicationHub });

    const notification = await inventory.relationships.notifyInventoryEvent(ORG, { title: 'Stock shortage detected', body: 'SKU-1 below minimum' });

    expect(notification).not.toBeNull();
    expect(notification!.notificationType).toBe('escalation');

    const found = await communicationHub.queries.findNotifications({ organizationId: ORG });
    expect(found.notifications.some((n) => n.id === notification!.id)).toBe(true);
  });

  it('relationships.recordInventoryValueMetric() records a real Analytics Engine gauge metric snapshot', async () => {
    const analytics = createAnalyticsRuntime();
    const inventory = createInventoryRuntime({ analytics });

    const metric = await inventory.relationships.recordInventoryValueMetric(ORG, { metricName: 'inventory.total_value', value: 15000 });

    expect(metric).not.toBeNull();
    expect(metric!.metricName).toBe('inventory.total_value');
    expect(metric!.value).toBe(15000);
  });

  it('relationships.logInventoryDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const inventory = createInventoryRuntime({ institutionalMemory });

    const entry = await inventory.relationships.logInventoryDecisionToMemory(ORG, {
      decision: 'Switched SKU-100 to FIFO costing',
      reason: 'cost volatility in supplier pricing',
    });
    expect(entry).not.toBeNull();

    const found = await institutionalMemory.queries.findKnowledge({ organizationId: ORG });
    expect(found.entries.some((e) => e.id === entry!.id)).toBe(true);
  });

  it('a single createInventoryRuntime() wires all seven real collaborators together at once', async () => {
    const finance = createFinanceRuntime();
    const sales = createSalesRuntime();
    const businessDna = createBusinessDnaRuntime();
    const workflow = createWorkflowRuntime();
    const communicationHub = createCommunicationRuntime();
    const analytics = createAnalyticsRuntime();
    const institutionalMemory = createInstitutionalMemoryRuntime();

    const inventory = createInventoryRuntime({ finance, sales, businessDna, workflow, communicationHub, analytics, institutionalMemory });

    expect(await inventory.relationships.getProductContext(ORG, 'missing')).toBeNull();
    expect(await inventory.relationships.getOpportunityContext(ORG, 'missing')).toBeNull();

    const raised = await inventory.relationships.raiseInventoryApprovalWorkflow(ORG, { requestType: 'smoke_test' });
    expect(raised).not.toBeNull();

    const metric = await inventory.relationships.recordInventoryValueMetric(ORG, { metricName: 'inventory.smoke_test', value: 1 });
    expect(metric).not.toBeNull();
  });
});
