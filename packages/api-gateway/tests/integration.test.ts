import { describe, expect, it } from 'vitest';
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
import { createComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import { createGovernanceRuntime } from '@lateen-os/ai-governance-engine';
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createCustomerSuccessRuntime } from '@lateen-os/customer-success-engine';
import { createFinanceRuntime } from '@lateen-os/finance-engine';
import { createHrRuntime } from '@lateen-os/hr-engine';
import { createInventoryRuntime } from '@lateen-os/inventory-engine';
import { createMarketingRuntime } from '@lateen-os/marketing-engine';
import { createObservabilityRuntime } from '@lateen-os/observability-engine';
import { createProjectRuntime } from '@lateen-os/project-management-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createApiGatewayRuntime } from '../src/runtime.js';

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
    profile: { displayName: 'Support Agent', workforceType: 'operations_ai', proactiveEnabled: false, reactiveEnabled: true },
    roles: [],
    capabilities: [],
    status: 'idle',
    lifecycle: 'activated',
    ...overrides,
  };
}

describe('API Gateway — real integration with all 16 public collaborator APIs', () => {
  it('relationshipManagement.getAgentContext() reflects a real AI Runtime agent', async () => {
    const agent = makeAgent();
    const { aiRuntime, agentRepository } = buildAiRuntimeQueries(agent);
    await agentRepository.save(agent);

    const gateway = createApiGatewayRuntime({ aiRuntime });
    const context = await gateway.relationshipManagement.getAgentContext(ORG, agent.id);

    expect(context?.profile.displayName).toBe('Support Agent');
  });

  it('relationshipManagement.raiseGatewayApprovalWorkflow() starts a real Workflow Engine workflow', async () => {
    const workflow = createWorkflowRuntime();
    const gateway = createApiGatewayRuntime({ workflow });

    const raised = await gateway.relationshipManagement.raiseGatewayApprovalWorkflow(ORG, { requestType: 'access-review' });
    expect(raised).not.toBeNull();

    const found = await workflow.queries.findRunningWorkflows({ organizationId: ORG });
    expect(found.instances.some((instance) => instance.id === raised!.workflowInstanceId)).toBe(true);
  });

  it('relationshipManagement.getCustomerContext() reflects a real CRM Engine customer', async () => {
    const crm = createCrmRuntime();
    const customer = await crm.customers.create(ORG, { name: 'Acme Retail Co' });

    const gateway = createApiGatewayRuntime({ crm });
    const context = await gateway.relationshipManagement.getCustomerContext(ORG, customer.id);

    expect(context?.name).toBe('Acme Retail Co');
  });

  it('relationshipManagement.getOpportunityContext() reflects a real Sales Engine opportunity', async () => {
    const sales = createSalesRuntime();
    const opportunity = await sales.opportunities.create(ORG, { name: 'Expansion Deal', amount: '15000.00', currency: 'USD' });

    const gateway = createApiGatewayRuntime({ sales });
    const context = await gateway.relationshipManagement.getOpportunityContext(ORG, opportunity.id);

    expect(context?.name).toBe('Expansion Deal');
  });

  it('relationshipManagement.getCampaignsContext() reflects real Marketing Engine campaigns', async () => {
    const marketing = createMarketingRuntime();
    await marketing.campaigns.create(ORG, { name: 'Spring Launch', campaignType: 'email' });

    const gateway = createApiGatewayRuntime({ marketing });
    const context = await gateway.relationshipManagement.getCampaignsContext(ORG);

    expect(context.some((campaign) => campaign.name === 'Spring Launch')).toBe(true);
  });

  it('relationshipManagement.notifyGatewayEvent() sends a real Communication Hub notification', async () => {
    const communicationHub = createCommunicationRuntime();
    const gateway = createApiGatewayRuntime({ communicationHub });

    const notification = await gateway.relationshipManagement.notifyGatewayEvent(ORG, { title: 'Route registered', body: 'New CRM route live' });
    expect(notification).not.toBeNull();
    expect(notification!.notificationType).toBe('escalation');

    const found = await communicationHub.queries.findNotifications({ organizationId: ORG });
    expect(found.notifications.some((notification_) => notification_.id === notification!.id)).toBe(true);
  });

  it('relationshipManagement.getChartOfAccountsContext() reflects real Finance Engine accounts', async () => {
    const finance = createFinanceRuntime();
    await finance.chartOfAccounts.create(ORG, { code: '1000', name: 'Cash', accountType: 'asset' });

    const gateway = createApiGatewayRuntime({ finance });
    const context = await gateway.relationshipManagement.getChartOfAccountsContext(ORG);

    expect(context.some((account) => account.code === '1000')).toBe(true);
  });

  it('relationshipManagement.getEmployeeContext() reflects a real HR Engine employee', async () => {
    const hr = createHrRuntime();
    const department = await hr.organizationStructure.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    const position = await hr.positions.create(ORG, { title: 'Engineer', departmentId: department.id, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '50000.00', currency: 'USD', headcount: 1 });
    const employee = await hr.employees.hire(ORG, {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      departmentId: department.id,
      positionId: position.id,
      employmentType: 'full_time',
      baseSalary: '50000.00',
      currency: 'USD',
      hireDate: '2026-01-01',
    });

    const gateway = createApiGatewayRuntime({ hr });
    const context = await gateway.relationshipManagement.getEmployeeContext(ORG, employee.id);

    expect(context?.email).toBe('jane.doe@example.com');
  });

  it('relationshipManagement.getInventoryItemContext() reflects a real Inventory Engine catalog item', async () => {
    const inventory = createInventoryRuntime();
    const item = await inventory.catalog.create(ORG, { sku: 'SKU-1', name: 'Widget', unitOfMeasure: 'each' });

    const gateway = createApiGatewayRuntime({ inventory });
    const context = await gateway.relationshipManagement.getInventoryItemContext(ORG, item.id);

    expect(context?.sku).toBe('SKU-1');
  });

  it('relationshipManagement.getProjectContext() reflects a real Project Management Engine project', async () => {
    const projects = createProjectRuntime();
    const project = await projects.projects.create(ORG, { code: 'PRJ-1', name: 'Onboarding Rollout' });

    const gateway = createApiGatewayRuntime({ projects });
    const context = await gateway.relationshipManagement.getProjectContext(ORG, project.id);

    expect(context?.name).toBe('Onboarding Rollout');
  });

  it('relationshipManagement.getCustomerSuccessContext() reflects a real Customer Success Engine record', async () => {
    const customerSuccess = createCustomerSuccessRuntime();
    await customerSuccess.customers.onboard(ORG, { customerId: 'customer-1' });

    const gateway = createApiGatewayRuntime({ customerSuccess });
    const context = await gateway.relationshipManagement.getCustomerSuccessContext(ORG, 'customer-1');

    expect(context?.customerId).toBe('customer-1');
  });

  it('relationshipManagement.recordGatewayMetric() records a real Analytics Engine gauge metric snapshot', async () => {
    const analytics = createAnalyticsRuntime();
    const gateway = createApiGatewayRuntime({ analytics });

    const metric = await gateway.relationshipManagement.recordGatewayMetric(ORG, { metricName: 'gateway.request', value: 1 });

    expect(metric).not.toBeNull();
    expect(metric!.metricName).toBe('gateway.request');
  });

  it('relationshipManagement.getObservabilityHealthContext() reflects a real Observability Engine health check', async () => {
    const observability = createObservabilityRuntime();
    await observability.health.checkComponentHealth(ORG, 'api-gateway', 'healthy');

    const gateway = createApiGatewayRuntime({ observability });
    const context = await gateway.relationshipManagement.getObservabilityHealthContext(ORG);

    expect(context.some((check) => check.component === 'api-gateway')).toBe(true);
  });

  it('relationshipManagement.getSecurityPolicyContext() reflects a real AI Security Engine policy', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authorization.createPolicy(ORG, { name: 'Deny External Calls', policyType: 'custom', effect: 'deny', rules: [] });

    const gateway = createApiGatewayRuntime({ aiSecurity });
    const context = await gateway.relationshipManagement.getSecurityPolicyContext(ORG);

    expect(context.some((policy) => policy.name === 'Deny External Calls')).toBe(true);
  });

  it('relationshipManagement.getGovernancePolicyContext() reflects a real AI Governance Engine policy', async () => {
    const aiGovernance = createGovernanceRuntime();
    await aiGovernance.policies.create(ORG, { name: 'Model Review Policy', policyType: 'ai' });

    const gateway = createApiGatewayRuntime({ aiGovernance });
    const context = await gateway.relationshipManagement.getGovernancePolicyContext(ORG);

    expect(context.some((policy) => policy.name === 'Model Review Policy')).toBe(true);
  });

  it('relationshipManagement.getComplianceFrameworkContext() reflects a real AI Compliance Engine framework', async () => {
    const aiCompliance = createComplianceRuntime();
    await aiCompliance.frameworks.create(ORG, { frameworkCode: 'GDPR', name: 'GDPR Framework' });

    const gateway = createApiGatewayRuntime({ aiCompliance });
    const context = await gateway.relationshipManagement.getComplianceFrameworkContext(ORG);

    expect(context.some((framework) => framework.frameworkCode === 'GDPR')).toBe(true);
  });

  it('a single createApiGatewayRuntime() wires all 16 real collaborators together at once', async () => {
    const agent = makeAgent({ id: 'agent-smoke' });
    const { aiRuntime, agentRepository } = buildAiRuntimeQueries(agent);
    await agentRepository.save(agent);

    const workflow = createWorkflowRuntime();
    const crm = createCrmRuntime();
    const sales = createSalesRuntime();
    const marketing = createMarketingRuntime();
    const communicationHub = createCommunicationRuntime();
    const finance = createFinanceRuntime();
    const hr = createHrRuntime();
    const inventory = createInventoryRuntime();
    const projects = createProjectRuntime();
    const customerSuccess = createCustomerSuccessRuntime();
    const analytics = createAnalyticsRuntime();
    const observability = createObservabilityRuntime();
    const aiSecurity = createSecurityRuntime();
    const aiGovernance = createGovernanceRuntime();
    const aiCompliance = createComplianceRuntime();

    const gateway = createApiGatewayRuntime({
      aiRuntime,
      workflow,
      crm,
      sales,
      marketing,
      communicationHub,
      finance,
      hr,
      inventory,
      projects,
      customerSuccess,
      analytics,
      observability,
      aiSecurity,
      aiGovernance,
      aiCompliance,
    });

    expect((await gateway.relationshipManagement.getAgentContext(ORG, 'agent-smoke'))?.id).toBe('agent-smoke');
    expect(await gateway.relationshipManagement.getCustomerContext(ORG, 'missing')).toBeNull();
    expect(await gateway.relationshipManagement.getChartOfAccountsContext(ORG)).toEqual([]);

    const metric = await gateway.relationshipManagement.recordGatewayMetric(ORG, { metricName: 'gateway.smoke_test', value: 1 });
    expect(metric).not.toBeNull();
  });

  it('the Runtime Dispatcher routes a live request through a real CRM Engine collaborator', async () => {
    const crm = createCrmRuntime();
    const customer = await crm.customers.create(ORG, { name: 'Dispatch Test Co' });

    const gateway = createApiGatewayRuntime({ crm });
    const api = await gateway.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const version = await gateway.registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await gateway.registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    const route = await gateway.registry.registerRoute(ORG, {
      endpointId: endpoint.id,
      method: 'GET',
      path: '/crm/customers',
      targetService: 'crm-engine',
      targetOperation: 'getCustomerContext',
      requiresAuth: false,
    });
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });

    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers', body: { customerId: customer.id } });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({ success: true, data: { id: customer.id, name: 'Dispatch Test Co' } });
  });

  it('the Runtime Dispatcher routes a live request through a real HR Engine collaborator', async () => {
    const hr = createHrRuntime();
    const department = await hr.organizationStructure.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    const position = await hr.positions.create(ORG, { title: 'Engineer', departmentId: department.id, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '50000.00', currency: 'USD', headcount: 1 });
    const employee = await hr.employees.hire(ORG, {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      departmentId: department.id,
      positionId: position.id,
      employmentType: 'full_time',
      baseSalary: '50000.00',
      currency: 'USD',
      hireDate: '2026-01-01',
    });

    const gateway = createApiGatewayRuntime({ hr });
    const api = await gateway.registry.registerApi(ORG, { code: 'hr', name: 'HR API' });
    const version = await gateway.registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await gateway.registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Employees' });
    const route = await gateway.registry.registerRoute(ORG, {
      endpointId: endpoint.id,
      method: 'GET',
      path: '/hr/employees',
      targetService: 'hr-engine',
      targetOperation: 'getEmployeeContext',
      requiresAuth: false,
    });
    await gateway.discovery.registerService(ORG, 'hr-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });

    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/hr/employees', body: { employeeId: employee.id } });
    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({ success: true, data: { email: 'jane.doe@example.com' } });
  });

  it('relationshipManagement.getChartOfAccountsContext() is unaffected by accounts registered against a different real Finance Engine instance', async () => {
    const finance = createFinanceRuntime();
    await finance.chartOfAccounts.create(ORG, { code: '2000', name: 'Accounts Payable', accountType: 'liability' });

    const otherFinance = createFinanceRuntime();
    const gateway = createApiGatewayRuntime({ finance: otherFinance });

    expect(await gateway.relationshipManagement.getChartOfAccountsContext(ORG)).toEqual([]);
  });
});
