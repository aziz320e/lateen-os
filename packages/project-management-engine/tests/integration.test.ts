import { describe, expect, it } from 'vitest';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createWorkforceRuntime } from '@lateen-os/ai-workforce';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createFinanceRuntime } from '@lateen-os/finance-engine';
import { createHrRuntime } from '@lateen-os/hr-engine';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createInventoryRuntime } from '@lateen-os/inventory-engine';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createProjectRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('Project Management Engine — real integration with the nine public collaborator APIs', () => {
  it('relationships.getCustomerContext() reflects a real CRM Engine customer', async () => {
    const crm = createCrmRuntime();
    const customer = await crm.customers.create(ORG, { name: 'Acme Retail Co' });

    const projectRuntime = createProjectRuntime({ crm });
    const context = await projectRuntime.relationships.getCustomerContext(ORG, customer.id);

    expect(context?.name).toBe('Acme Retail Co');
  });

  it('relationships.getEmployeeContext() reflects a real HR Engine employee', async () => {
    const hr = createHrRuntime();
    const department = await hr.organizationStructure.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    const position = await hr.positions.create(ORG, { title: 'Project Manager', departmentId: department.id, jobGrade: 'G5', salaryGrade: 'S5', baseSalary: '90000.00', currency: 'USD', headcount: 1 });
    const employee = await hr.employees.hire(ORG, {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      departmentId: department.id,
      positionId: position.id,
      employmentType: 'full_time',
      baseSalary: '90000.00',
      currency: 'USD',
      hireDate: '2026-01-01',
    });

    const projectRuntime = createProjectRuntime({ hr });
    const context = await projectRuntime.relationships.getEmployeeContext(ORG, employee.id);

    expect(context?.firstName).toBe('Jane');
  });

  it('relationships.getAiWorkforceUtilizationContext() reflects a real active AI Workforce worker, reached only through HR Engine', async () => {
    const aiWorkforce = createWorkforceRuntime();
    const worker = await aiWorkforce.lifecycle.hire({
      organizationId: ORG,
      businessDnaAgentId: 'agent-1',
      runtimeAgentId: 'runtime-agent-1',
      profile: { displayName: 'PM Assistant', title: 'PM AI', workforceType: 'hr_ai', proactiveEnabled: true, reactiveEnabled: true },
    });
    await aiWorkforce.lifecycle.activate(ORG, worker.id);

    const hr = createHrRuntime({ aiWorkforce: aiWorkforce.queries });
    const projectRuntime = createProjectRuntime({ hr });
    const context = await projectRuntime.relationships.getAiWorkforceUtilizationContext(ORG);

    expect(context).not.toBeNull();
    expect(context!.activeCount).toBeGreaterThanOrEqual(1);
  });

  it('relationships.recordProjectCostEntry() composes and posts a real Finance Engine journal entry', async () => {
    const finance = createFinanceRuntime();
    const projectAccount = await finance.chartOfAccounts.create(ORG, { code: '6100', name: 'Project Expenses', accountType: 'expense' });
    const cashAccount = await finance.chartOfAccounts.create(ORG, { code: '1000', name: 'Cash', accountType: 'asset' });

    const projectRuntime = createProjectRuntime({ finance });
    const entry = await projectRuntime.relationships.recordProjectCostEntry(ORG, {
      projectAccountId: projectAccount.id,
      offsetAccountId: cashAccount.id,
      amount: '500.00',
      currency: 'USD',
      entryDate: '2026-01-15',
    });

    expect(entry).not.toBeNull();
    expect(entry!.status).toBe('posted');

    const found = await finance.generalLedger.getJournalEntry(ORG, entry!.id);
    expect(found?.status).toBe('posted');
  });

  it('relationships.reserveProjectMaterial() composes a real Inventory Engine stock reservation', async () => {
    const inventory = createInventoryRuntime();
    const item = await inventory.catalog.create(ORG, { sku: 'SKU-PM-1', name: 'Steel Beam', unitOfMeasure: 'EA' });
    const warehouse = await inventory.warehouses.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    await inventory.movements.receive(ORG, { itemId: item.id, warehouseId: warehouse.id, quantity: '100.00' });

    const projectRuntime = createProjectRuntime({ inventory });
    const movement = await projectRuntime.relationships.reserveProjectMaterial(ORG, { itemId: item.id, warehouseId: warehouse.id, quantity: '25.00' });

    expect(movement).not.toBeNull();
    expect(movement!.movementType).toBe('reservation');

    const level = await inventory.stock.getByItemAndWarehouse(ORG, item.id, warehouse.id);
    expect(level?.reservedQuantity).toBe('25.00');
  });

  it('relationships.raiseProjectApprovalWorkflow() starts a real Workflow Engine instance', async () => {
    const workflow = createWorkflowRuntime();
    const projectRuntime = createProjectRuntime({ workflow });

    const raised = await projectRuntime.relationships.raiseProjectApprovalWorkflow(ORG, { requestType: 'budget_approval', notes: 'over threshold' });
    expect(raised).not.toBeNull();

    const found = await workflow.queries.findWorkflow({ organizationId: ORG, definitionId: raised!.workflowDefinitionId });
    expect(found.definition).not.toBeNull();
  });

  it('relationships.notifyProjectEvent() sends a real Communication Hub notification', async () => {
    const communicationHub = createCommunicationRuntime();
    const projectRuntime = createProjectRuntime({ communicationHub });

    const notification = await projectRuntime.relationships.notifyProjectEvent(ORG, { title: 'Milestone at risk', body: 'Launch milestone slipping' });

    expect(notification).not.toBeNull();
    expect(notification!.notificationType).toBe('escalation');

    const found = await communicationHub.queries.findNotifications({ organizationId: ORG });
    expect(found.notifications.some((n) => n.id === notification!.id)).toBe(true);
  });

  it('relationships.recordProjectMetric() records a real Analytics Engine gauge metric snapshot', async () => {
    const analytics = createAnalyticsRuntime();
    const projectRuntime = createProjectRuntime({ analytics });

    const metric = await projectRuntime.relationships.recordProjectMetric(ORG, { metricName: 'project.progress', value: 65 });

    expect(metric).not.toBeNull();
    expect(metric!.metricName).toBe('project.progress');
    expect(metric!.value).toBe(65);
  });

  it('relationships.getBusinessProfileContext() reads a real Business DNA business profile', async () => {
    const businessDna = createBusinessDnaRuntime();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme Projects Co',
      legalEntity: { legalName: 'Acme Projects Co Ltd.', jurisdiction: 'US-DE' },
    });

    const projectRuntime = createProjectRuntime({ businessDna });
    const profile = await projectRuntime.relationships.getBusinessProfileContext(ORG);

    expect(profile?.displayName).toBe('Acme Projects Co');
  });

  it('relationships.logProjectDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const projectRuntime = createProjectRuntime({ institutionalMemory });

    const entry = await projectRuntime.relationships.logProjectDecisionToMemory(ORG, {
      decision: 'Descoped phase 2 to protect launch date',
      reason: 'resourcing shortfall discovered mid-sprint',
    });
    expect(entry).not.toBeNull();

    const found = await institutionalMemory.queries.findKnowledge({ organizationId: ORG });
    expect(found.entries.some((e) => e.id === entry!.id)).toBe(true);
  });

  it('a single createProjectRuntime() wires all nine real collaborators together at once', async () => {
    const crm = createCrmRuntime();
    const hr = createHrRuntime();
    const finance = createFinanceRuntime();
    const inventory = createInventoryRuntime();
    const workflow = createWorkflowRuntime();
    const communicationHub = createCommunicationRuntime();
    const analytics = createAnalyticsRuntime();
    const businessDna = createBusinessDnaRuntime();
    const institutionalMemory = createInstitutionalMemoryRuntime();

    const projectRuntime = createProjectRuntime({ crm, hr, finance, inventory, workflow, communicationHub, analytics, businessDna, institutionalMemory });

    expect(await projectRuntime.relationships.getCustomerContext(ORG, 'missing')).toBeNull();
    expect(await projectRuntime.relationships.getEmployeeContext(ORG, 'missing')).toBeNull();
    // `hr` here was not itself given an `aiWorkforce` collaborator, so HR Engine's own
    // integration degrades to null — proving the passthrough is genuine, not hardcoded.
    expect(await projectRuntime.relationships.getAiWorkforceUtilizationContext(ORG)).toBeNull();

    const raised = await projectRuntime.relationships.raiseProjectApprovalWorkflow(ORG, { requestType: 'smoke_test' });
    expect(raised).not.toBeNull();

    const metric = await projectRuntime.relationships.recordProjectMetric(ORG, { metricName: 'project.smoke_test', value: 1 });
    expect(metric).not.toBeNull();
  });
});
