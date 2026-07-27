import { describe, expect, it } from 'vitest';
import { createBrainSystem } from '@lateen-os/ai-brain';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';

const ORG = 'org-1';

describe('createRelationshipManagement without collaborators', () => {
  it('every method degrades to null when nothing is injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getBrainPlanContext(ORG, 'plan-1')).toBeNull();
    expect(await relationships.raiseSecurityWorkflowRequest(ORG, { requestType: 'incident' })).toBeNull();
    expect(await relationships.notifySecurityEvent(ORG, { title: 'Alert' })).toBeNull();
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
  });
});

describe('createRelationshipManagement with real AI Brain, Workflow Engine, Communication Hub, and Business DNA runtimes', () => {
  function setup() {
    const aiBrain = createBrainSystem();
    const workflow = createWorkflowRuntime();
    const communicationHub = createCommunicationRuntime();
    const businessDna = createBusinessDnaRuntime();
    const relationships = createRelationshipManagement({ aiBrain: { queries: aiBrain.queries }, workflow, communicationHub, businessDna });
    return { aiBrain, workflow, communicationHub, businessDna, relationships };
  }

  it('getBrainPlanContext() explains a real AI Brain execution plan', async () => {
    const { aiBrain, relationships } = setup();
    const response = await aiBrain.brain.process({
      organizationId: ORG,
      sessionId: 'session-1',
      correlationId: 'correlation-1',
      rawInput: 'Summarize last quarter revenue',
    });

    const context = await relationships.getBrainPlanContext(ORG, response.plan.id);
    expect(context?.plan.id).toBe(response.plan.id);
  });

  it('getBrainPlanContext() returns null for an unknown plan', async () => {
    const { relationships } = setup();
    expect(await relationships.getBrainPlanContext(ORG, 'missing')).toBeNull();
  });

  it('raiseSecurityWorkflowRequest() defines and starts a real backing workflow instance', async () => {
    const { workflow, relationships } = setup();
    const raised = await relationships.raiseSecurityWorkflowRequest(ORG, { requestType: 'incident_response', notes: 'Critical threat detected' });
    expect(raised).not.toBeNull();

    const { instances } = await workflow.queries.findRunningWorkflows({ organizationId: ORG, definitionId: raised!.workflowDefinitionId });
    const instance = instances.find((candidate) => candidate.id === raised!.workflowInstanceId);
    expect(instance).toBeDefined();
    expect(instance?.variables.notes).toBe('Critical threat detected');
  });

  it('raiseSecurityWorkflowRequest() reuses the same workflow definition for the same organization and request type', async () => {
    const { relationships } = setup();
    const first = await relationships.raiseSecurityWorkflowRequest(ORG, { requestType: 'incident_response' });
    const second = await relationships.raiseSecurityWorkflowRequest(ORG, { requestType: 'incident_response' });
    expect(second?.workflowDefinitionId).toBe(first?.workflowDefinitionId);
    expect(second?.workflowInstanceId).not.toBe(first?.workflowInstanceId);
  });

  it('notifySecurityEvent() creates and sends a real Communication Hub escalation notification', async () => {
    const { communicationHub, relationships } = setup();
    const notification = await relationships.notifySecurityEvent(ORG, { title: 'Critical threat detected', body: 'Immediate action required' });
    expect(notification?.notificationType).toBe('escalation');
    expect(notification?.status).toBe('sent');

    const persisted = await communicationHub.queries.findNotifications({ organizationId: ORG });
    expect(persisted.notifications.some((n) => n.id === notification!.id)).toBe(true);
  });

  it('getBusinessProfileContext() fetches a real Business DNA business profile', async () => {
    const { businessDna, relationships } = setup();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme Manufacturing',
      legalEntity: {
        legalName: 'Acme Manufacturing LLC',
        entityType: 'llc',
        registrationNumber: 'REG-001',
        taxId: 'TAX-001',
        countryOfIncorporation: 'US',
      },
    });
    const context = await relationships.getBusinessProfileContext(ORG);
    expect(context?.displayName).toBe('Acme Manufacturing');
  });

  it('getBusinessProfileContext() returns null when no profile has been set up', async () => {
    const { relationships } = setup();
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
  });

  it('is organization-scoped for the business profile lookup', async () => {
    const { businessDna, relationships } = setup();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme Manufacturing',
      legalEntity: {
        legalName: 'Acme Manufacturing LLC',
        entityType: 'llc',
        registrationNumber: 'REG-001',
        taxId: 'TAX-001',
        countryOfIncorporation: 'US',
      },
    });
    expect(await relationships.getBusinessProfileContext('org-2')).toBeNull();
  });
});
