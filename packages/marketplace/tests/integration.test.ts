import { describe, expect, it } from 'vitest';
import { createAdminConsoleRuntime } from '@lateen-os/admin-console';
import {
  createAgentRepository,
  createConversationRepository,
  createExecutionPlanRepository,
  createExecutionResultRepository,
  createRuntimeQueries,
  createRuntimeSessionRepository,
  createTaskRepository,
  type Agent,
} from '@lateen-os/ai-runtime';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createApiGatewayRuntime } from '@lateen-os/api-gateway';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createObservabilityRuntime } from '@lateen-os/observability-engine';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createMarketplaceRuntime } from '../src/runtime.js';

const ORG = 'org-1';

function buildAiRuntimeQueries(agent: Agent) {
  const agentRepository = createAgentRepository();
  return {
    aiRuntime: createRuntimeQueries({
      agentRepository,
      taskRepository: createTaskRepository(),
      runtimeSessionRepository: createRuntimeSessionRepository(),
      conversationRepository: createConversationRepository(),
      executionPlanRepository: createExecutionPlanRepository(),
      executionResultRepository: createExecutionResultRepository(),
    }),
    agentRepository,
  };
}

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'agent-1',
    organizationId: ORG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    businessDnaAgentId: 'dna-agent-1',
    profile: { displayName: 'Marketplace Agent', workforceType: 'operations_ai', proactiveEnabled: false, reactiveEnabled: true },
    roles: [],
    capabilities: [],
    status: 'idle',
    lifecycle: 'activated',
    ...overrides,
  };
}

describe('Marketplace — real integration with all 8 public collaborator APIs', () => {
  it('relationshipManagement.getApiGatewayContext() reflects a real API Gateway registered API', async () => {
    const apiGateway = createApiGatewayRuntime();
    await apiGateway.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });

    const marketplace = createMarketplaceRuntime({ apiGateway });
    const context = await marketplace.relationshipManagement.getApiGatewayContext(ORG);

    expect(context.some((api) => api.code === 'crm')).toBe(true);
  });

  it('relationshipManagement.getAdminOrganizationContext() reflects a real Admin Console organization', async () => {
    const adminConsole = createAdminConsoleRuntime();
    await adminConsole.organizations.registerOrganization(ORG, { name: 'Acme Marketplace Co' });

    const marketplace = createMarketplaceRuntime({ adminConsole });
    const context = await marketplace.relationshipManagement.getAdminOrganizationContext(ORG);

    expect(context?.name).toBe('Acme Marketplace Co');
  });

  it('relationshipManagement.getAgentContext() reflects a real AI Runtime agent', async () => {
    const agent = makeAgent();
    const { aiRuntime, agentRepository } = buildAiRuntimeQueries(agent);
    await agentRepository.save(agent);

    const marketplace = createMarketplaceRuntime({ aiRuntime });
    const context = await marketplace.relationshipManagement.getAgentContext(ORG, agent.id);

    expect(context?.profile.displayName).toBe('Marketplace Agent');
  });

  it('relationshipManagement.raiseExtensionApprovalWorkflow() starts a real Workflow Engine workflow', async () => {
    const workflow = createWorkflowRuntime();
    const marketplace = createMarketplaceRuntime({ workflow });

    const raised = await marketplace.relationshipManagement.raiseExtensionApprovalWorkflow(ORG, { requestType: 'publish' });
    expect(raised).not.toBeNull();

    const found = await workflow.queries.findRunningWorkflows({ organizationId: ORG });
    expect(found.instances.some((instance) => instance.id === raised!.workflowInstanceId)).toBe(true);
  });

  it('relationshipManagement.getAnalyticsSnapshotContext() reflects a real Analytics Engine KPI snapshot', async () => {
    const analytics = createAnalyticsRuntime();
    await analytics.kpis.recordRevenue(ORG, { value: 50000 });

    const marketplace = createMarketplaceRuntime({ analytics });
    const context = await marketplace.relationshipManagement.getAnalyticsSnapshotContext(ORG);

    expect(context.length).toBeGreaterThan(0);
  });

  it('relationshipManagement.getObservabilityHealthContext() reflects a real Observability Engine health check', async () => {
    const observability = createObservabilityRuntime();
    await observability.health.checkComponentHealth(ORG, 'marketplace', 'healthy');

    const marketplace = createMarketplaceRuntime({ observability });
    const context = await marketplace.relationshipManagement.getObservabilityHealthContext(ORG);

    expect(context.some((check) => check.component === 'marketplace')).toBe(true);
  });

  it('relationshipManagement.notifyMarketplaceEvent() sends a real Communication Hub notification', async () => {
    const communicationHub = createCommunicationRuntime();
    const marketplace = createMarketplaceRuntime({ communicationHub });

    const notification = await marketplace.relationshipManagement.notifyMarketplaceEvent(ORG, { title: 'Extension published', body: 'com.acme.widget v1.0.0' });
    expect(notification).not.toBeNull();
    expect(notification!.notificationType).toBe('escalation');

    const found = await communicationHub.queries.findNotifications({ organizationId: ORG });
    expect(found.notifications.some((n) => n.id === notification!.id)).toBe(true);
  });

  it('relationshipManagement.logMarketplaceDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const marketplace = createMarketplaceRuntime({ institutionalMemory });

    const entry = await marketplace.relationshipManagement.logMarketplaceDecisionToMemory(ORG, {
      decision: 'Approved extension "com.acme.widget" for publication',
      reason: 'passed automated compatibility and signature checks',
    });
    expect(entry).not.toBeNull();

    const found = await institutionalMemory.queries.findKnowledge({ organizationId: ORG });
    expect(found.entries.some((e) => e.id === entry!.id)).toBe(true);
  });

  it('a single createMarketplaceRuntime() wires all 8 real collaborators together at once', async () => {
    const agent = makeAgent({ id: 'agent-smoke' });
    const { aiRuntime, agentRepository } = buildAiRuntimeQueries(agent);
    await agentRepository.save(agent);

    const apiGateway = createApiGatewayRuntime();
    const adminConsole = createAdminConsoleRuntime();
    const workflow = createWorkflowRuntime();
    const analytics = createAnalyticsRuntime();
    const observability = createObservabilityRuntime();
    const communicationHub = createCommunicationRuntime();
    const institutionalMemory = createInstitutionalMemoryRuntime();

    const marketplace = createMarketplaceRuntime({
      apiGateway,
      adminConsole,
      aiRuntime,
      workflow,
      analytics,
      observability,
      communicationHub,
      institutionalMemory,
    });

    expect((await marketplace.relationshipManagement.getAgentContext(ORG, 'agent-smoke'))?.id).toBe('agent-smoke');
    expect(await marketplace.relationshipManagement.getApiGatewayContext(ORG)).toEqual([]);
    expect(await marketplace.relationshipManagement.getAdminOrganizationContext(ORG)).toBeNull();

    const notification = await marketplace.relationshipManagement.notifyMarketplaceEvent(ORG, { title: 'Smoke test' });
    expect(notification).not.toBeNull();
  });

  it('relationshipManagement.getAdminOrganizationContext() is unaffected by organizations registered against a different real Admin Console instance', async () => {
    const adminConsole = createAdminConsoleRuntime();
    await adminConsole.organizations.registerOrganization(ORG, { name: 'Acme Co' });

    const otherAdminConsole = createAdminConsoleRuntime();
    const marketplace = createMarketplaceRuntime({ adminConsole: otherAdminConsole });

    expect(await marketplace.relationshipManagement.getAdminOrganizationContext(ORG)).toBeNull();
  });

  it('relationshipManagement.getApiGatewayContext() reflects only that organization’s real registered APIs', async () => {
    const apiGateway = createApiGatewayRuntime();
    await apiGateway.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    await apiGateway.registry.registerApi('org-2', { code: 'hr', name: 'HR API' });

    const marketplace = createMarketplaceRuntime({ apiGateway });
    const context = await marketplace.relationshipManagement.getApiGatewayContext(ORG);

    expect(context.map((api) => api.code)).toEqual(['crm']);
  });

  it('relationshipManagement.getAnalyticsSnapshotContext() is unaffected by KPIs recorded against a different real Analytics Engine instance', async () => {
    const analytics = createAnalyticsRuntime();
    await analytics.kpis.recordRevenue(ORG, { value: 1000 });

    const otherAnalytics = createAnalyticsRuntime();
    const marketplace = createMarketplaceRuntime({ analytics: otherAnalytics });

    expect(await marketplace.relationshipManagement.getAnalyticsSnapshotContext(ORG)).toEqual([]);
  });

  it('relationshipManagement.getObservabilityHealthContext() reflects only that organization’s real health checks', async () => {
    const observability = createObservabilityRuntime();
    await observability.health.checkComponentHealth(ORG, 'marketplace', 'healthy');
    await observability.health.checkComponentHealth('org-2', 'marketplace', 'unhealthy');

    const marketplace = createMarketplaceRuntime({ observability });
    const context = await marketplace.relationshipManagement.getObservabilityHealthContext(ORG);

    expect(context).toHaveLength(1);
    expect(context[0]?.status).toBe('healthy');
  });

  it('relationshipManagement.raiseExtensionApprovalWorkflow() twice for different request types creates two real distinct workflow definitions', async () => {
    const workflow = createWorkflowRuntime();
    const marketplace = createMarketplaceRuntime({ workflow });

    const first = await marketplace.relationshipManagement.raiseExtensionApprovalWorkflow(ORG, { requestType: 'publish' });
    const second = await marketplace.relationshipManagement.raiseExtensionApprovalWorkflow(ORG, { requestType: 'uninstall-review' });

    expect(first!.workflowDefinitionId).not.toBe(second!.workflowDefinitionId);
  });

  it('relationshipManagement.getAdminOrganizationContext() reflects the organization’s current status after a real Admin Console transition', async () => {
    const adminConsole = createAdminConsoleRuntime();
    await adminConsole.organizations.registerOrganization(ORG, { name: 'Acme Co' });
    await adminConsole.organizations.suspendOrganization(ORG);

    const marketplace = createMarketplaceRuntime({ adminConsole });
    const context = await marketplace.relationshipManagement.getAdminOrganizationContext(ORG);

    expect(context?.status).toBe('suspended');
  });

  it('a real Workflow Engine instance started via raiseExtensionApprovalWorkflow is genuinely queryable through Workflow Engine’s own query layer, not just via the returned ids', async () => {
    const workflow = createWorkflowRuntime();
    const marketplace = createMarketplaceRuntime({ workflow });
    const raised = await marketplace.relationshipManagement.raiseExtensionApprovalWorkflow(ORG, { requestType: 'publish', notes: 'first review' });
    const running = await workflow.queries.findRunningWorkflows({ organizationId: ORG });
    expect(running.instances.some((instance) => instance.id === raised!.workflowInstanceId)).toBe(true);
  });

  it('a full install -> publish -> validate flow runs end-to-end with real sibling notification on install', async () => {
    const communicationHub = createCommunicationRuntime();
    const marketplace = createMarketplaceRuntime({ communicationHub });

    const extension = await marketplace.extensions.install(ORG, { key: 'com.acme.widget', name: 'Acme Widget', currentVersion: '1.0.0' });
    await marketplace.packages.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    await marketplace.sandbox.createSandboxProfile(ORG, { extensionId: extension.id });
    const validation = await marketplace.extensions.validateExtension(ORG, extension.id);
    expect(validation.valid).toBe(true);

    const notification = await marketplace.relationshipManagement.notifyMarketplaceEvent(ORG, { title: `Extension ${extension.key} validated` });
    expect(notification).not.toBeNull();
  });
});
