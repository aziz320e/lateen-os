import { describe, expect, it } from 'vitest';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createCustomerSuccessRuntime } from '@lateen-os/customer-success-engine';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createProjectRuntime } from '@lateen-os/project-management-engine';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createDocumentManagementRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('Document Management Engine — real integration with the eight public collaborator APIs', () => {
  it('relationshipManagement.getBusinessProfileContext() reads a real Business DNA business profile', async () => {
    const businessDna = createBusinessDnaRuntime();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme Documents Co',
      legalEntity: { legalName: 'Acme Documents Co Ltd.', jurisdiction: 'US-DE' },
    });

    const dme = createDocumentManagementRuntime({ businessDna });
    const profile = await dme.relationshipManagement.getBusinessProfileContext(ORG);

    expect(profile?.displayName).toBe('Acme Documents Co');
  });

  it('relationshipManagement.logDocumentDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const dme = createDocumentManagementRuntime({ institutionalMemory });

    const entry = await dme.relationshipManagement.logDocumentDecisionToMemory(ORG, {
      decision: 'Approved contract v3 for signature',
      reason: 'legal review completed with no exceptions',
    });
    expect(entry).not.toBeNull();

    const found = await institutionalMemory.queries.findKnowledge({ organizationId: ORG });
    expect(found.entries.some((e) => e.id === entry!.id)).toBe(true);
  });

  it('relationshipManagement.notifyDocumentEvent() sends a real Communication Hub notification', async () => {
    const communicationHub = createCommunicationRuntime();
    const dme = createDocumentManagementRuntime({ communicationHub });

    const notification = await dme.relationshipManagement.notifyDocumentEvent(ORG, { title: 'Contract pending approval', body: 'Review needed' });

    expect(notification).not.toBeNull();
    expect(notification!.notificationType).toBe('escalation');

    const found = await communicationHub.queries.findNotifications({ organizationId: ORG });
    expect(found.notifications.some((n) => n.id === notification!.id)).toBe(true);
  });

  it('relationshipManagement.getProjectContext() reflects a real Project Management Engine project', async () => {
    const projects = createProjectRuntime();
    const project = await projects.projects.create(ORG, { code: 'PRJ-1', name: 'Contract Rollout' });

    const dme = createDocumentManagementRuntime({ projects });
    const context = await dme.relationshipManagement.getProjectContext(ORG, project.id);

    expect(context?.name).toBe('Contract Rollout');
  });

  it('relationshipManagement.getCustomerContext() reflects a real CRM Engine customer', async () => {
    const crm = createCrmRuntime();
    const customer = await crm.customers.create(ORG, { name: 'Acme Retail Co' });

    const dme = createDocumentManagementRuntime({ crm });
    const context = await dme.relationshipManagement.getCustomerContext(ORG, customer.id);

    expect(context?.name).toBe('Acme Retail Co');
  });

  it('relationshipManagement.getCustomerSuccessContext() reflects a real Customer Success Engine record', async () => {
    const customerSuccess = createCustomerSuccessRuntime();
    const record = await customerSuccess.customers.onboard(ORG, { customerId: 'customer-1' });

    const dme = createDocumentManagementRuntime({ customerSuccess });
    const context = await dme.relationshipManagement.getCustomerSuccessContext(ORG, 'customer-1');

    expect(context?.id).toBe(record.id);
    expect(context?.status).toBe('onboarding');
  });

  it('relationshipManagement.raiseDocumentApprovalWorkflow() starts a real Workflow Engine instance', async () => {
    const workflow = createWorkflowRuntime();
    const dme = createDocumentManagementRuntime({ workflow });

    const raised = await dme.relationshipManagement.raiseDocumentApprovalWorkflow(ORG, { requestType: 'contract_approval', notes: 'urgent' });
    expect(raised).not.toBeNull();

    const found = await workflow.queries.findWorkflow({ organizationId: ORG, definitionId: raised!.workflowDefinitionId });
    expect(found.definition).not.toBeNull();
  });

  it('relationshipManagement.recordDocumentMetric() records a real Analytics Engine gauge metric snapshot', async () => {
    const analytics = createAnalyticsRuntime();
    const dme = createDocumentManagementRuntime({ analytics });

    const metric = await dme.relationshipManagement.recordDocumentMetric(ORG, { metricName: 'document.published_count', value: 12 });

    expect(metric).not.toBeNull();
    expect(metric!.metricName).toBe('document.published_count');
    expect(metric!.value).toBe(12);
  });

  it('relationshipManagement.getProjectContext() returns null when Project Management Engine is injected but the project is unknown', async () => {
    const projects = createProjectRuntime();
    const dme = createDocumentManagementRuntime({ projects });
    expect(await dme.relationshipManagement.getProjectContext(ORG, 'missing')).toBeNull();
  });

  it('relationshipManagement.getCustomerContext() returns null when CRM Engine is injected but the customer is unknown', async () => {
    const crm = createCrmRuntime();
    const dme = createDocumentManagementRuntime({ crm });
    expect(await dme.relationshipManagement.getCustomerContext(ORG, 'missing')).toBeNull();
  });

  it('a single createDocumentManagementRuntime() wires all eight real collaborators together at once', async () => {
    const businessDna = createBusinessDnaRuntime();
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const communicationHub = createCommunicationRuntime();
    const projects = createProjectRuntime();
    const crm = createCrmRuntime();
    const customerSuccess = createCustomerSuccessRuntime();
    const workflow = createWorkflowRuntime();
    const analytics = createAnalyticsRuntime();

    const dme = createDocumentManagementRuntime({ businessDna, institutionalMemory, communicationHub, projects, crm, customerSuccess, workflow, analytics });

    expect(await dme.relationshipManagement.getCustomerContext(ORG, 'missing')).toBeNull();
    expect(await dme.relationshipManagement.getProjectContext(ORG, 'missing')).toBeNull();
    expect(await dme.relationshipManagement.getCustomerSuccessContext(ORG, 'missing')).toBeNull();

    const raised = await dme.relationshipManagement.raiseDocumentApprovalWorkflow(ORG, { requestType: 'smoke_test' });
    expect(raised).not.toBeNull();

    const metric = await dme.relationshipManagement.recordDocumentMetric(ORG, { metricName: 'document.smoke_test', value: 1 });
    expect(metric).not.toBeNull();
  });
});
