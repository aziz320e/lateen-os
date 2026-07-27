import { describe, expect, it } from 'vitest';
import {
  createRuntimeQueries,
  createAgentRepository,
  createTaskRepository,
  createRuntimeSessionRepository,
  createConversationRepository,
  createExecutionPlanRepository,
  createExecutionResultRepository,
} from '@lateen-os/ai-runtime';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createGovernanceRuntime } from '@lateen-os/ai-governance-engine';
import { createComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createObservabilityRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createObservabilityRuntime — full integration across all 7 real sibling packages', () => {
  it('wires AI Runtime, Workflow Engine, Communication Hub, AI Security, AI Governance, AI Compliance, and Analytics Engine, each through its real public API', async () => {
    const aiRuntime = createRuntimeQueries({
      agentRepository: createAgentRepository(),
      taskRepository: createTaskRepository(),
      runtimeSessionRepository: createRuntimeSessionRepository(),
      conversationRepository: createConversationRepository(),
      executionPlanRepository: createExecutionPlanRepository(),
      executionResultRepository: createExecutionResultRepository(),
    });
    const workflow = createWorkflowRuntime();
    const communicationHub = createCommunicationRuntime();
    const aiSecurity = createSecurityRuntime();
    const aiGovernance = createGovernanceRuntime();
    const aiCompliance = createComplianceRuntime();
    const analyticsRuntime = createAnalyticsRuntime();

    const runtime = createObservabilityRuntime({
      aiRuntime,
      workflow,
      communicationHub,
      aiSecurity,
      aiGovernance,
      aiCompliance,
      analyticsEngine: analyticsRuntime.queries,
    });

    // Seed real activity in every integrated package.
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'integration.review',
      name: 'Integration Review',
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'review', name: 'Review', type: 'human', optional: false }],
      transitions: [],
    });
    const instance = await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    const conversation = await communicationHub.conversations.create(ORG, { conversationType: 'customer' });
    await communicationHub.messages.create(ORG, { conversationId: conversation.id, messageType: 'text', body: 'hello' });

    await aiSecurity.authentication.validateToken(ORG, 'not-a-real-token');

    await aiGovernance.decisions.recordDecision(ORG, {
      decisionType: 'agent_approval',
      subjectId: 'agent-1',
      outcome: 'approved',
      reviewerId: 'reviewer-1',
    });

    const framework = await aiCompliance.frameworks.create(ORG, { frameworkCode: 'GDPR', name: 'GDPR' });
    await aiCompliance.audits.createAuditPlan(ORG, { frameworkId: framework.id, title: 'Annual audit' });

    await analyticsRuntime.dashboards.create(ORG, { dashboardType: 'ceo', name: 'CEO Overview' });

    // Health Engine — real AI Runtime + Workflow Engine dependency health.
    const runtimeHealth = await runtime.health.checkRuntimeHealth(ORG);
    expect(runtimeHealth.component).toBe('ai-runtime');
    const workflowHealth = await runtime.health.checkWorkflowDependencyHealth(ORG);
    expect(workflowHealth.status).toBe('healthy');

    // Alert Engine — real workflow failure and security event detection.
    await workflow.orchestrator.dispatch({ organizationId: ORG, command: 'fail', instanceId: instance.id, stepId: 'step-1' });
    const workflowAlert = await runtime.alerts.checkWorkflowFailures(ORG);
    expect(workflowAlert?.alertType).toBe('workflow_failure');
    const securityAlert = await runtime.alerts.checkSecurityEvents(ORG, 1);
    expect(securityAlert?.alertType).toBe('security_event');

    // Performance Engine — real AI Runtime + Workflow Engine + Communication Hub.
    const messageThroughput = await runtime.performance.recordMessageThroughput(ORG, 1);
    expect(messageThroughput.value).toBeGreaterThanOrEqual(1);

    // Audit Timeline — real aggregation across all 5 sources.
    const timeline = await runtime.auditTimeline.aggregateTimeline(ORG);
    const sources = new Set(timeline.map((entry) => entry.source));
    expect(sources.has('security')).toBe(true);
    expect(sources.has('governance')).toBe(true);
    expect(sources.has('compliance')).toBe(true);
    expect(sources.has('workflow')).toBe(true);
    expect(sources.has('communication')).toBe(true);

    // Snapshot Engine — real data across all 5 categories.
    const runtimeSnapshot = await runtime.snapshots.computeSnapshot(ORG, 'runtime');
    expect(runtimeSnapshot.data.state).toBeDefined();
    const workflowSnapshot = await runtime.snapshots.computeSnapshot(ORG, 'workflows');
    expect(workflowSnapshot.data.total).toBeGreaterThanOrEqual(1);
    const commSnapshot = await runtime.snapshots.computeSnapshot(ORG, 'communications');
    expect(commSnapshot.data.messageCount).toBeGreaterThanOrEqual(1);
    const analyticsSnapshot = await runtime.snapshots.computeSnapshot(ORG, 'analytics');
    expect(typeof analyticsSnapshot.data.kpiSnapshotCount).toBe('number');
    const securitySnapshot = await runtime.snapshots.computeSnapshot(ORG, 'security');
    expect(securitySnapshot.data.violationCount).toBeGreaterThanOrEqual(1);

    // Relationship Layer — one additional real signal per package.
    expect(await runtime.relationships.getAiRuntimeContext(ORG)).toEqual({ agentCount: 0 });
    expect(await runtime.relationships.getWorkflowContext(ORG)).toEqual({ waitingTaskCount: 0 });
    const commContext = await runtime.relationships.getCommunicationContext(ORG);
    expect(commContext).not.toBeNull();
    const secContext = await runtime.relationships.getSecurityContext(ORG);
    expect(secContext).not.toBeNull();
    const govContext = await runtime.relationships.getGovernanceContext(ORG);
    expect(govContext).not.toBeNull();
    const compContext = await runtime.relationships.getComplianceContext(ORG);
    expect(compContext).not.toBeNull();
    const analyticsContext = await runtime.relationships.getAnalyticsContext(ORG);
    expect(analyticsContext).toEqual({ dashboardCount: 1 });

    // Query Layer — read every kind of record back.
    expect((await runtime.queries.findAlerts({ organizationId: ORG })).total).toBeGreaterThanOrEqual(2);
    expect((await runtime.queries.findSnapshots({ organizationId: ORG })).total).toBeGreaterThanOrEqual(5);
    expect((await runtime.queries.findHealth({ organizationId: ORG })).total).toBeGreaterThanOrEqual(2);
    expect((await runtime.queries.findPerformance({ organizationId: ORG })).total).toBeGreaterThanOrEqual(1);
  });
});

describe('createObservabilityRuntime — narrower real integration scenarios', () => {
  it('Health Engine reports unhealthy when the majority of real workflow instances have failed', async () => {
    const workflow = createWorkflowRuntime();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'integration.unhealthy',
      name: 'Integration Unhealthy',
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'work', name: 'Work', type: 'human', optional: false }],
      transitions: [],
    });
    const instance = await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    await workflow.orchestrator.dispatch({ organizationId: ORG, command: 'fail', instanceId: instance.id, stepId: 'step-1' });

    const runtime = createObservabilityRuntime({ workflow });
    const health = await runtime.health.checkWorkflowDependencyHealth(ORG);
    expect(health.status).toBe('unhealthy');
  });

  it('Alert Engine resolves a real workflow-failure alert end-to-end', async () => {
    const workflow = createWorkflowRuntime();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'integration.resolve',
      name: 'Integration Resolve',
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'work', name: 'Work', type: 'human', optional: false }],
      transitions: [],
    });
    const instance = await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    await workflow.orchestrator.dispatch({ organizationId: ORG, command: 'fail', instanceId: instance.id, stepId: 'step-1' });

    const runtime = createObservabilityRuntime({ workflow });
    const alert = await runtime.alerts.checkWorkflowFailures(ORG);
    expect(alert?.status).toBe('open');
    const resolved = await runtime.alerts.resolve(ORG, alert!.id);
    expect(resolved.status).toBe('resolved');
    expect((await runtime.queries.findAlerts({ organizationId: ORG, status: 'open' })).total).toBe(0);
  });

  it('Performance Engine computes real queue latency end-to-end through the runtime', async () => {
    const aiRuntime = createRuntimeQueries({
      agentRepository: createAgentRepository(),
      taskRepository: createTaskRepository(),
      runtimeSessionRepository: createRuntimeSessionRepository(),
      conversationRepository: createConversationRepository(),
      executionPlanRepository: createExecutionPlanRepository(),
      executionResultRepository: createExecutionResultRepository(),
    });
    const runtime = createObservabilityRuntime({ aiRuntime });
    const sample = await runtime.performance.recordQueueLatency(ORG);
    expect(sample.value).toBe(0);
    expect(sample.metric).toBe('queue_latency');
  });

  it('Audit Timeline aggregation is idempotent in shape across repeated calls', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authentication.validateToken(ORG, 'bad');
    const runtime = createObservabilityRuntime({ aiSecurity });
    const first = await runtime.auditTimeline.aggregateTimeline(ORG);
    const second = await runtime.auditTimeline.aggregateTimeline(ORG);
    expect(first).toHaveLength(second.length);
  });

  it('Snapshot Engine and Query Layer agree on the persisted snapshot count', async () => {
    const analyticsRuntime = createAnalyticsRuntime();
    const runtime = createObservabilityRuntime({ analyticsEngine: analyticsRuntime.queries });
    await runtime.snapshots.computeSnapshot(ORG, 'analytics');
    await runtime.snapshots.computeSnapshot(ORG, 'analytics');
    const found = await runtime.queries.findSnapshots({ organizationId: ORG, category: 'analytics' });
    expect(found.total).toBe(2);
  });
});
