import { describe, expect, it } from 'vitest';
import { createRuntimeQueries, createAgentRepository, createTaskRepository, createRuntimeSessionRepository, createConversationRepository, createExecutionPlanRepository, createExecutionResultRepository } from '@lateen-os/ai-runtime';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createGovernanceRuntime } from '@lateen-os/ai-governance-engine';
import { createComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';

const ORG = 'org-1';

describe('createRelationshipManagement — offline (no collaborators injected)', () => {
  it('every context method returns null', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getAiRuntimeContext(ORG)).toBeNull();
    expect(await relationships.getWorkflowContext(ORG)).toBeNull();
    expect(await relationships.getCommunicationContext(ORG)).toBeNull();
    expect(await relationships.getSecurityContext(ORG)).toBeNull();
    expect(await relationships.getGovernanceContext(ORG)).toBeNull();
    expect(await relationships.getComplianceContext(ORG)).toBeNull();
    expect(await relationships.getAnalyticsContext(ORG)).toBeNull();
  });
});

describe('createRelationshipManagement — getAiRuntimeContext (real AI Runtime)', () => {
  it('returns a real agent count', async () => {
    const aiRuntime = createRuntimeQueries({
      agentRepository: createAgentRepository(),
      taskRepository: createTaskRepository(),
      runtimeSessionRepository: createRuntimeSessionRepository(),
      conversationRepository: createConversationRepository(),
      executionPlanRepository: createExecutionPlanRepository(),
      executionResultRepository: createExecutionResultRepository(),
    });
    const relationships = createRelationshipManagement({ aiRuntime });
    expect(await relationships.getAiRuntimeContext(ORG)).toEqual({ agentCount: 0 });
  });
});

describe('createRelationshipManagement — getWorkflowContext (real Workflow Engine)', () => {
  it('returns a real waiting-task count', async () => {
    const workflow = createWorkflowRuntime();
    const relationships = createRelationshipManagement({ workflow });
    const context = await relationships.getWorkflowContext(ORG);
    expect(context).toEqual({ waitingTaskCount: 0 });
  });
});

describe('createRelationshipManagement — getCommunicationContext (real Communication Hub)', () => {
  it('returns a real notification count', async () => {
    const communicationHub = createCommunicationRuntime();
    const notification = await communicationHub.notifications.create(ORG, { notificationType: 'user', title: 'Ping' });
    await communicationHub.notifications.send(ORG, notification.id);
    const relationships = createRelationshipManagement({ communicationHub });
    expect(await relationships.getCommunicationContext(ORG)).toEqual({ notificationCount: 1 });
  });
});

describe('createRelationshipManagement — getSecurityContext (real AI Security Engine)', () => {
  it('returns a real policy count', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authorization.createPolicy(ORG, { name: 'p', policyType: 'rbac', effect: 'allow', rules: [] });
    const relationships = createRelationshipManagement({ aiSecurity });
    expect(await relationships.getSecurityContext(ORG)).toEqual({ policyCount: 1 });
  });
});

describe('createRelationshipManagement — getGovernanceContext (real AI Governance Engine)', () => {
  it('returns a real pending-approval count', async () => {
    const aiGovernance = createGovernanceRuntime();
    await aiGovernance.approvals.requestApproval(ORG, { category: 'model_approval', subjectId: 'model-1' });
    const relationships = createRelationshipManagement({ aiGovernance });
    expect(await relationships.getGovernanceContext(ORG)).toEqual({ pendingApprovalCount: 1 });
  });
});

describe('createRelationshipManagement — getComplianceContext (real AI Compliance Engine)', () => {
  it('returns a real active-framework count', async () => {
    const aiCompliance = createComplianceRuntime();
    await aiCompliance.frameworks.create(ORG, { frameworkCode: 'GDPR', name: 'GDPR' });
    const relationships = createRelationshipManagement({ aiCompliance });
    const context = await relationships.getComplianceContext(ORG);
    expect(typeof context?.activeFrameworkCount).toBe('number');
  });
});

describe('createRelationshipManagement — getAnalyticsContext (real Analytics Engine)', () => {
  it('returns a real dashboard count', async () => {
    const analyticsRuntime = createAnalyticsRuntime();
    await analyticsRuntime.dashboards.create(ORG, { dashboardType: 'ceo', name: 'CEO Overview' });
    const relationships = createRelationshipManagement({ analyticsEngine: analyticsRuntime.queries });
    expect(await relationships.getAnalyticsContext(ORG)).toEqual({ dashboardCount: 1 });
  });

  it('returns 0 when there are no dashboards yet', async () => {
    const analyticsRuntime = createAnalyticsRuntime();
    const relationships = createRelationshipManagement({ analyticsEngine: analyticsRuntime.queries });
    expect(await relationships.getAnalyticsContext(ORG)).toEqual({ dashboardCount: 0 });
  });
});

describe('createRelationshipManagement — independence of collaborators', () => {
  it('injecting only one collaborator leaves the others null', async () => {
    const workflow = createWorkflowRuntime();
    const relationships = createRelationshipManagement({ workflow });
    expect(await relationships.getWorkflowContext(ORG)).toEqual({ waitingTaskCount: 0 });
    expect(await relationships.getAiRuntimeContext(ORG)).toBeNull();
    expect(await relationships.getSecurityContext(ORG)).toBeNull();
    expect(await relationships.getAnalyticsContext(ORG)).toBeNull();
  });
});
