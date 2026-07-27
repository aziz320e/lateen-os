import { describe, expect, it } from 'vitest';
import { createBrainSystem } from '@lateen-os/ai-brain';
import { createAgentRegistryRepository, createAgentRegistryService } from '@lateen-os/ai-runtime';
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createGovernanceRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('AI Governance Engine — real integration with the six public collaborator APIs', () => {
  it('agentGovernance.isAgentRegisteredInRuntime() reflects a real AI Runtime agent registration', async () => {
    const agentRegistryRepository = createAgentRegistryRepository();
    const agentRegistryService = createAgentRegistryService(agentRegistryRepository);

    await agentRegistryService.register(ORG, {
      runtimeAgentId: 'agent-1',
      businessDnaAgentId: 'business-agent-1',
      profile: {
        displayName: 'Sales Assistant',
        workforceType: 'sales_ai',
        proactiveEnabled: false,
        reactiveEnabled: true,
      },
      registeredAt: new Date().toISOString(),
    });

    const governance = createGovernanceRuntime({ agentRuntimeRegistry: agentRegistryService });

    expect(await governance.agentGovernance.isAgentRegisteredInRuntime(ORG, 'agent-1')).toBe(true);
    expect(await governance.agentGovernance.isAgentRegisteredInRuntime(ORG, 'agent-unknown')).toBe(false);
  });

  it('relationships.getSecurityViolationsContext() reflects a real AI Security Engine violation', async () => {
    const security = createSecurityRuntime();
    await security.authentication.validateToken(ORG, 'not-a-real-token');

    const governance = createGovernanceRuntime({ aiSecurity: security });
    const violations = await governance.relationships.getSecurityViolationsContext(ORG);

    expect(violations).not.toBeNull();
    expect(violations!.some((event) => event.category === 'authentication')).toBe(true);
  });

  it('relationships.getBrainPlanContext() explains a real AI Brain execution plan', async () => {
    const { brain, queries } = createBrainSystem();
    const response = await brain.process({
      organizationId: ORG,
      sessionId: 'session-1',
      correlationId: 'correlation-1',
      rawInput: 'Review Q3 marketing spend',
    });

    const governance = createGovernanceRuntime({ aiBrain: { queries } });
    const explanation = await governance.relationships.getBrainPlanContext(ORG, response.plan.id);

    expect(explanation).not.toBeNull();
  });

  it('relationships.getBrainPlanContext() returns null for an unknown plan (real PlanNotFoundError caught)', async () => {
    const { queries } = createBrainSystem();
    const governance = createGovernanceRuntime({ aiBrain: { queries } });
    expect(await governance.relationships.getBrainPlanContext(ORG, 'missing-plan')).toBeNull();
  });

  it('relationships.raiseGovernanceWorkflowRequest() starts a real Workflow Engine instance', async () => {
    const workflow = createWorkflowRuntime();
    const governance = createGovernanceRuntime({ workflow });

    const first = await governance.relationships.raiseGovernanceWorkflowRequest(ORG, { requestType: 'policy_review', notes: 'quarterly review' });
    expect(first).not.toBeNull();

    const instance = await workflow.queries.findWorkflow({ organizationId: ORG, definitionId: first!.workflowDefinitionId });
    expect(instance.definition).not.toBeNull();
  });

  it('relationships.notifyGovernanceEvent() sends a real Communication Hub notification', async () => {
    const communicationHub = createCommunicationRuntime();
    const governance = createGovernanceRuntime({ communicationHub });

    const notification = await governance.relationships.notifyGovernanceEvent(ORG, { title: 'Risk escalated', body: 'Critical risk requires review' });

    expect(notification).not.toBeNull();
    expect(notification!.notificationType).toBe('escalation');

    const found = await communicationHub.queries.findNotifications({ organizationId: ORG });
    expect(found.notifications.some((n) => n.id === notification!.id)).toBe(true);
  });

  it('relationships.getBusinessProfileContext() reads a real Business DNA business profile', async () => {
    const businessDna = createBusinessDnaRuntime();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme Corp',
      legalEntity: { legalName: 'Acme Corporation Ltd.', jurisdiction: 'US-DE' },
    });

    const governance = createGovernanceRuntime({ businessDna });
    const profile = await governance.relationships.getBusinessProfileContext(ORG);

    expect(profile?.displayName).toBe('Acme Corp');
  });

  it('workflowGovernance.checkExecutionPolicy() counts real running Workflow Engine instances', async () => {
    const workflow = createWorkflowRuntime();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'governance.test-workflow',
      name: 'Test Workflow',
      metadata: { category: 'governance' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'review', name: 'Review', type: 'human', optional: false }],
      transitions: [],
    });
    await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    const governance = createGovernanceRuntime({ workflowQueries: workflow.queries });
    const record = await governance.workflowGovernance.requestApproval(ORG, { workflowCode: 'governance.test-workflow' });
    await governance.workflowGovernance.setExecutionPolicy(ORG, record.id, { maxConcurrentInstances: 1 });

    const check = await governance.workflowGovernance.checkExecutionPolicy(ORG, record.id);
    expect(check.runningCount).toBeGreaterThanOrEqual(1);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('max_concurrent_instances_exceeded');
  });

  it('a single createGovernanceRuntime() wires all six real collaborators together at once', async () => {
    const security = createSecurityRuntime();
    const agentRegistryRepository = createAgentRegistryRepository();
    const agentRegistryService = createAgentRegistryService(agentRegistryRepository);
    const { queries: brainQueries } = createBrainSystem();
    const workflow = createWorkflowRuntime();
    const businessDna = createBusinessDnaRuntime();
    const communicationHub = createCommunicationRuntime();

    const governance = createGovernanceRuntime({
      aiSecurity: security,
      agentRuntimeRegistry: agentRegistryService,
      aiBrain: { queries: brainQueries },
      workflow,
      workflowQueries: workflow.queries,
      businessDna,
      communicationHub,
    });

    expect(await governance.relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await governance.agentGovernance.isAgentRegisteredInRuntime(ORG, 'agent-1')).toBe(false);
    expect(await governance.relationships.getSecurityViolationsContext(ORG)).toEqual([]);

    const raised = await governance.relationships.raiseGovernanceWorkflowRequest(ORG, { requestType: 'smoke_test' });
    expect(raised).not.toBeNull();
  });
});
