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
import { createPerformanceSampleRepository } from '../src/performance/repository.impl.js';
import { createPerformanceEngine } from '../src/performance/engine.impl.js';

const ORG = 'org-1';

function createRealRuntimeQueries() {
  const taskRepository = createTaskRepository();
  const executionResultRepository = createExecutionResultRepository();
  const queries = createRuntimeQueries({
    agentRepository: createAgentRepository(),
    taskRepository,
    runtimeSessionRepository: createRuntimeSessionRepository(),
    conversationRepository: createConversationRepository(),
    executionPlanRepository: createExecutionPlanRepository(),
    executionResultRepository,
  });
  return { queries, taskRepository, executionResultRepository };
}

function setup() {
  const repository = createPerformanceSampleRepository();
  return { repository };
}

describe('createPerformanceEngine — recordExecutionTime', () => {
  it('records 0 when AI Runtime is not injected', async () => {
    const { repository } = setup();
    const engine = createPerformanceEngine(repository);
    const sample = await engine.recordExecutionTime(ORG);
    expect(sample.value).toBe(0);
    expect(sample.metric).toBe('execution_time');
  });

  it('computes the mean completedAt-createdAt across real execution results', async () => {
    const { queries, executionResultRepository } = createRealRuntimeQueries();
    await executionResultRepository.save({
      id: 'result-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:30.000Z',
      planId: 'plan-1',
      context: { sessionId: 'session-1', taskId: 'task-1', startedAt: '2026-01-01T00:00:00.000Z' },
      success: true,
      completedAt: '2026-01-01T00:00:30.000Z',
    });
    const { repository } = setup();
    const engine = createPerformanceEngine(repository, { aiRuntime: queries });
    const sample = await engine.recordExecutionTime(ORG, { planId: 'plan-1' });
    expect(sample.value).toBe(30_000);
  });

  it('returns 0 when no scope is given, matching AI Runtime\'s own findExecutionHistory constraint', async () => {
    const { queries, executionResultRepository } = createRealRuntimeQueries();
    await executionResultRepository.save({
      id: 'result-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:30.000Z',
      planId: 'plan-1',
      context: { sessionId: 'session-1', taskId: 'task-1', startedAt: '2026-01-01T00:00:00.000Z' },
      success: true,
      completedAt: '2026-01-01T00:00:30.000Z',
    });
    const { repository } = setup();
    const engine = createPerformanceEngine(repository, { aiRuntime: queries });
    const sample = await engine.recordExecutionTime(ORG);
    expect(sample.value).toBe(0);
  });
});

describe('createPerformanceEngine — recordQueueLatency', () => {
  it('records 0 when AI Runtime is not injected', async () => {
    const { repository } = setup();
    const engine = createPerformanceEngine(repository);
    const sample = await engine.recordQueueLatency(ORG);
    expect(sample.value).toBe(0);
  });

  it('computes the mean updatedAt-createdAt across real assigned tasks', async () => {
    const { queries, taskRepository } = createRealRuntimeQueries();
    await taskRepository.save({
      id: 'task-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:01:00.000Z',
      title: 't',
      runtimeAgentId: 'agent-1',
      priority: 'normal',
      status: 'assigned',
    });
    await taskRepository.save({
      id: 'task-2',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      title: 't2',
      runtimeAgentId: 'agent-1',
      priority: 'normal',
      status: 'queued',
    });
    const { repository } = setup();
    const engine = createPerformanceEngine(repository, { aiRuntime: queries });
    const sample = await engine.recordQueueLatency(ORG);
    expect(sample.value).toBe(60_000);
    expect(sample.context).toEqual({ sampleCount: 1 });
  });
});

describe('createPerformanceEngine — recordWorkflowDuration (real Workflow Engine)', () => {
  it('records 0 when Workflow Engine is not injected', async () => {
    const { repository } = setup();
    const engine = createPerformanceEngine(repository);
    const sample = await engine.recordWorkflowDuration(ORG);
    expect(sample.value).toBe(0);
  });

  it('computes the mean completedAt-startedAt across real completed instances', async () => {
    const workflow = createWorkflowRuntime();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'test.perf',
      name: 'Test Perf',
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'work', name: 'Work', type: 'human', optional: false }],
      transitions: [],
    });
    const instance = await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    await workflow.orchestrator.dispatch({ organizationId: ORG, command: 'complete', instanceId: instance.id, stepId: 'step-1' });

    const { repository } = setup();
    const engine = createPerformanceEngine(repository, { workflow });
    const sample = await engine.recordWorkflowDuration(ORG);
    expect(sample.value).toBeGreaterThanOrEqual(0);
  });
});

describe('createPerformanceEngine — recordMessageThroughput (real Communication Hub)', () => {
  it('records 0 when Communication Hub is not injected', async () => {
    const { repository } = setup();
    const engine = createPerformanceEngine(repository);
    const sample = await engine.recordMessageThroughput(ORG, 10);
    expect(sample.value).toBe(0);
  });

  it('computes messages per minute from a real message count', async () => {
    const communicationHub = createCommunicationRuntime();
    const conversation = await communicationHub.conversations.create(ORG, { conversationType: 'customer' });
    await communicationHub.messages.create(ORG, { conversationId: conversation.id, messageType: 'text', body: 'hi' });
    await communicationHub.messages.create(ORG, { conversationId: conversation.id, messageType: 'text', body: 'there' });

    const { repository } = setup();
    const engine = createPerformanceEngine(repository, { communicationHub });
    const sample = await engine.recordMessageThroughput(ORG, 2);
    expect(sample.value).toBe(1);
  });

  it('returns 0 when periodMinutes is 0', async () => {
    const communicationHub = createCommunicationRuntime();
    const { repository } = setup();
    const engine = createPerformanceEngine(repository, { communicationHub });
    const sample = await engine.recordMessageThroughput(ORG, 0);
    expect(sample.value).toBe(0);
  });
});

describe('createPerformanceEngine — recordRuntimeUtilization', () => {
  it('records 0 when AI Runtime is not injected', async () => {
    const { repository } = setup();
    const engine = createPerformanceEngine(repository);
    const sample = await engine.recordRuntimeUtilization(ORG);
    expect(sample.value).toBe(0);
  });

  it('computes activeSessionCount / (activeSessionCount + queuedTaskCount) as a percentage', async () => {
    const { queries } = createRealRuntimeQueries();
    const { repository } = setup();
    const engine = createPerformanceEngine(repository, { aiRuntime: queries });
    const sample = await engine.recordRuntimeUtilization(ORG);
    expect(sample.value).toBe(0);
    expect(sample.unit).toBe('percentage');
  });
});

describe('createPerformanceEngine — get / list / findByMetric / org scoping', () => {
  it('get() returns null for an unknown sample', async () => {
    const { repository } = setup();
    const engine = createPerformanceEngine(repository);
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every recorded sample', async () => {
    const { repository } = setup();
    const engine = createPerformanceEngine(repository);
    await engine.recordExecutionTime(ORG);
    await engine.recordQueueLatency(ORG);
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('findByMetric() filters by metric', async () => {
    const { repository } = setup();
    const engine = createPerformanceEngine(repository);
    await engine.recordExecutionTime(ORG);
    await engine.recordQueueLatency(ORG);
    expect(await engine.findByMetric(ORG, 'execution_time')).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { repository } = setup();
    const engine = createPerformanceEngine(repository);
    const sample = await engine.recordExecutionTime(ORG);
    expect(await repository.findById('org-2', sample.id)).toBeNull();
  });

  it('findByMetric() returns an empty array when no sample matches', async () => {
    const { repository } = setup();
    const engine = createPerformanceEngine(repository);
    expect(await engine.findByMetric(ORG, 'workflow_duration')).toEqual([]);
  });
});

describe('createPerformanceEngine — additional coverage', () => {
  it('recordWorkflowDuration ignores completed instances with no completedAt (defensive)', async () => {
    const workflow = createWorkflowRuntime();
    const { repository } = setup();
    const engine = createPerformanceEngine(repository, { workflow });
    const sample = await engine.recordWorkflowDuration(ORG);
    expect(sample.context).toEqual({ sampleCount: 0 });
  });

  it('every recorded metric uses the correct unit', async () => {
    const { repository } = setup();
    const engine = createPerformanceEngine(repository);
    expect((await engine.recordExecutionTime(ORG)).unit).toBe('ms');
    expect((await engine.recordQueueLatency(ORG)).unit).toBe('ms');
    expect((await engine.recordWorkflowDuration(ORG)).unit).toBe('ms');
    expect((await engine.recordMessageThroughput(ORG, 1)).unit).toBe('per_minute');
    expect((await engine.recordRuntimeUtilization(ORG)).unit).toBe('percentage');
  });

  it('accepts an injectable now() clock', async () => {
    const fixed = '2026-03-01T00:00:00.000Z';
    const repository = createPerformanceSampleRepository();
    const engine = createPerformanceEngine(repository, {}, () => fixed);
    const sample = await engine.recordExecutionTime(ORG);
    expect(sample.recordedAt).toBe(fixed);
  });
});
