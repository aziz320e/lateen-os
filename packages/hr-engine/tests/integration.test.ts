import { describe, expect, it } from 'vitest';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createWorkforceRuntime } from '@lateen-os/ai-workforce';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createFinanceRuntime } from '@lateen-os/finance-engine';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createHrRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('HR Engine — real integration with the seven public collaborator APIs', () => {
  it('relationships.getBusinessProfileContext() reads a real Business DNA business profile', async () => {
    const businessDna = createBusinessDnaRuntime();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme People Co',
      legalEntity: { legalName: 'Acme People Co Ltd.', jurisdiction: 'US-DE' },
    });

    const hr = createHrRuntime({ businessDna });
    const profile = await hr.relationships.getBusinessProfileContext(ORG);

    expect(profile?.displayName).toBe('Acme People Co');
  });

  it('relationships.recordPayrollTaxWithholding() computes a real Finance Engine tax calculation', async () => {
    const finance = createFinanceRuntime();
    const rule = await finance.tax.createTaxRule(ORG, { name: 'Payroll Withholding', taxType: 'VAT', ratePct: '10' });

    const hr = createHrRuntime({ finance });
    const calculation = await hr.relationships.recordPayrollTaxWithholding(ORG, { taxRuleId: rule.id, taxableAmount: '1000.00' });

    expect(calculation).not.toBeNull();
    expect(calculation!.taxAmount).toBe('100.00');

    const found = await finance.tax.getCalculation(ORG, calculation!.id);
    expect(found).not.toBeNull();
  });

  it('relationships.getAiWorkforceUtilizationContext() reflects a real active AI Workforce worker', async () => {
    const aiWorkforce = createWorkforceRuntime();
    const worker = await aiWorkforce.lifecycle.hire({
      organizationId: ORG,
      businessDnaAgentId: 'agent-1',
      runtimeAgentId: 'runtime-agent-1',
      profile: { displayName: 'HR Assistant', title: 'HR AI', workforceType: 'hr_ai', proactiveEnabled: true, reactiveEnabled: true },
    });
    await aiWorkforce.lifecycle.activate(ORG, worker.id);

    const hr = createHrRuntime({ aiWorkforce: aiWorkforce.queries });
    const context = await hr.relationships.getAiWorkforceUtilizationContext(ORG);

    expect(context).not.toBeNull();
    expect(context!.activeCount).toBeGreaterThanOrEqual(1);
  });

  it('relationships.raiseHrApprovalWorkflow() starts a real Workflow Engine instance', async () => {
    const workflow = createWorkflowRuntime();
    const hr = createHrRuntime({ workflow });

    const raised = await hr.relationships.raiseHrApprovalWorkflow(ORG, { requestType: 'termination_approval', notes: 'performance-based' });
    expect(raised).not.toBeNull();

    const found = await workflow.queries.findWorkflow({ organizationId: ORG, definitionId: raised!.workflowDefinitionId });
    expect(found.definition).not.toBeNull();
  });

  it('relationships.notifyHrEvent() sends a real Communication Hub notification', async () => {
    const communicationHub = createCommunicationRuntime();
    const hr = createHrRuntime({ communicationHub });

    const notification = await hr.relationships.notifyHrEvent(ORG, { title: 'Leave request pending', body: 'Approval needed' });

    expect(notification).not.toBeNull();
    expect(notification!.notificationType).toBe('escalation');

    const found = await communicationHub.queries.findNotifications({ organizationId: ORG });
    expect(found.notifications.some((n) => n.id === notification!.id)).toBe(true);
  });

  it('relationships.recordWorkforceUtilizationKpi() records a real Analytics Engine KPI snapshot', async () => {
    const analytics = createAnalyticsRuntime();
    const hr = createHrRuntime({ analytics });

    const kpi = await hr.relationships.recordWorkforceUtilizationKpi(ORG, { value: 82 });

    expect(kpi).not.toBeNull();
    expect(kpi!.kpiType).toBe('workforce_utilization');
    expect(kpi!.value).toBe(82);
  });

  it('relationships.logHrDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const hr = createHrRuntime({ institutionalMemory });

    const entry = await hr.relationships.logHrDecisionToMemory(ORG, { decision: 'Approved department reorg', reason: 'restructuring for scale' });
    expect(entry).not.toBeNull();

    const found = await institutionalMemory.queries.findKnowledge({ organizationId: ORG });
    expect(found.entries.some((e) => e.id === entry!.id)).toBe(true);
  });

  it('relationships.recordPayrollTaxWithholding() reflects a real Finance Engine EXEMPT tax rule producing 0 tax', async () => {
    const finance = createFinanceRuntime();
    const rule = await finance.tax.createTaxRule(ORG, { name: 'Exempt Payroll', taxType: 'EXEMPT', ratePct: '0' });

    const hr = createHrRuntime({ finance });
    const calculation = await hr.relationships.recordPayrollTaxWithholding(ORG, { taxRuleId: rule.id, taxableAmount: '1000.00' });

    expect(calculation!.taxAmount).toBe('0.00');
  });

  it('a single createHrRuntime() wires all seven real collaborators together at once', async () => {
    const finance = createFinanceRuntime();
    const aiWorkforce = createWorkforceRuntime();
    const businessDna = createBusinessDnaRuntime();
    const workflow = createWorkflowRuntime();
    const communicationHub = createCommunicationRuntime();
    const analytics = createAnalyticsRuntime();
    const institutionalMemory = createInstitutionalMemoryRuntime();

    const hr = createHrRuntime({
      finance,
      aiWorkforce: aiWorkforce.queries,
      businessDna,
      workflow,
      communicationHub,
      analytics,
      institutionalMemory,
    });

    expect(await hr.relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await hr.relationships.getAiWorkforceUtilizationContext(ORG)).toEqual({ busyCount: 0, activeCount: 0, utilizationPercentage: 0 });

    const raised = await hr.relationships.raiseHrApprovalWorkflow(ORG, { requestType: 'smoke_test' });
    expect(raised).not.toBeNull();

    const kpi = await hr.relationships.recordWorkforceUtilizationKpi(ORG, { value: 50 });
    expect(kpi).not.toBeNull();
  });
});
