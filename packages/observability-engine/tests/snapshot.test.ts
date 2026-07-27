import { describe, expect, it, vi } from 'vitest';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createRuntimeQueries, createAgentRepository, createTaskRepository, createRuntimeSessionRepository, createConversationRepository, createExecutionPlanRepository, createExecutionResultRepository } from '@lateen-os/ai-runtime';
import { createObservabilityEventBus } from '../src/events/observability-event-bus.js';
import { createObservabilitySnapshotRepository } from '../src/snapshot/repository.impl.js';
import { createSnapshotEngine } from '../src/snapshot/engine.impl.js';

const ORG = 'org-1';

function setup() {
  const repository = createObservabilitySnapshotRepository();
  const eventBus = createObservabilityEventBus();
  return { repository, eventBus };
}

function createRealRuntimeQueries() {
  return createRuntimeQueries({
    agentRepository: createAgentRepository(),
    taskRepository: createTaskRepository(),
    runtimeSessionRepository: createRuntimeSessionRepository(),
    conversationRepository: createConversationRepository(),
    executionPlanRepository: createExecutionPlanRepository(),
    executionResultRepository: createExecutionResultRepository(),
  });
}

describe('createSnapshotEngine — offline categories (no collaborators injected)', () => {
  it('computes an empty-data snapshot for each of the 5 categories', async () => {
    const { repository } = setup();
    const engine = createSnapshotEngine(repository);
    for (const category of ['runtime', 'workflows', 'communications', 'analytics', 'security'] as const) {
      const snapshot = await engine.computeSnapshot(ORG, category);
      expect(snapshot.category).toBe(category);
      expect(snapshot.data).toEqual({});
    }
  });
});

describe('createSnapshotEngine — runtime category (real AI Runtime)', () => {
  it('computes real runtime state data', async () => {
    const aiRuntime = createRealRuntimeQueries();
    const { repository } = setup();
    const engine = createSnapshotEngine(repository, { aiRuntime });
    const snapshot = await engine.computeSnapshot(ORG, 'runtime');
    expect(snapshot.data).toEqual({ state: 'initializing', activeSessionCount: 0, queuedTaskCount: 0 });
  });
});

describe('createSnapshotEngine — workflows category (real Workflow Engine)', () => {
  it('computes real workflow instance counts', async () => {
    const workflow = createWorkflowRuntime();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'test.snap',
      name: 'Test Snap',
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'work', name: 'Work', type: 'human', optional: false }],
      transitions: [],
    });
    await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    const { repository } = setup();
    const engine = createSnapshotEngine(repository, { workflow });
    const snapshot = await engine.computeSnapshot(ORG, 'workflows');
    expect(snapshot.data.total).toBe(1);
    expect(snapshot.data.active).toBe(1);
  });
});

describe('createSnapshotEngine — communications category (real Communication Hub)', () => {
  it('computes real message and timeline counts', async () => {
    const communicationHub = createCommunicationRuntime();
    const conversation = await communicationHub.conversations.create(ORG, { conversationType: 'customer' });
    await communicationHub.messages.create(ORG, { conversationId: conversation.id, messageType: 'text', body: 'hi' });
    const { repository } = setup();
    const engine = createSnapshotEngine(repository, { communicationHub });
    const snapshot = await engine.computeSnapshot(ORG, 'communications');
    expect(snapshot.data.messageCount).toBe(1);
    expect(typeof snapshot.data.timelineEntryCount).toBe('number');
  });
});

describe('createSnapshotEngine — analytics category (real Analytics Engine)', () => {
  it('computes real KPI snapshot count', async () => {
    const analyticsRuntime = createAnalyticsRuntime();
    await analyticsRuntime.kpis.recordRevenue(ORG, { value: 100 });
    const { repository } = setup();
    const engine = createSnapshotEngine(repository, { analyticsEngine: analyticsRuntime.queries });
    const snapshot = await engine.computeSnapshot(ORG, 'analytics');
    expect(snapshot.data.kpiSnapshotCount).toBe(1);
  });
});

describe('createSnapshotEngine — security category (real AI Security Engine)', () => {
  it('computes real violation and threat counts', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authentication.validateToken(ORG, 'bad-token');
    const { repository } = setup();
    const engine = createSnapshotEngine(repository, { aiSecurity });
    const snapshot = await engine.computeSnapshot(ORG, 'security');
    expect(snapshot.data.violationCount).toBe(1);
    expect(typeof snapshot.data.threatCount).toBe('number');
  });
});

describe('createSnapshotEngine — event publishing', () => {
  it('publishes snapshot.created with the computed category', async () => {
    const { repository, eventBus } = setup();
    const engine = createSnapshotEngine(repository, {}, eventBus);
    const handler = vi.fn();
    eventBus.subscribe('snapshot.created', handler);
    const snapshot = await engine.computeSnapshot(ORG, 'security');
    expect(handler).toHaveBeenCalledWith(
      { organizationId: ORG, snapshotId: snapshot.id, category: 'security' },
      expect.anything(),
    );
  });
});

describe('createSnapshotEngine — get / list / findByCategory / org scoping', () => {
  it('get() returns null for an unknown snapshot', async () => {
    const { repository } = setup();
    const engine = createSnapshotEngine(repository);
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every computed snapshot', async () => {
    const { repository } = setup();
    const engine = createSnapshotEngine(repository);
    await engine.computeSnapshot(ORG, 'runtime');
    await engine.computeSnapshot(ORG, 'security');
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('findByCategory() filters by category', async () => {
    const { repository } = setup();
    const engine = createSnapshotEngine(repository);
    await engine.computeSnapshot(ORG, 'runtime');
    await engine.computeSnapshot(ORG, 'security');
    expect(await engine.findByCategory(ORG, 'security')).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { repository } = setup();
    const engine = createSnapshotEngine(repository);
    const snapshot = await engine.computeSnapshot(ORG, 'runtime');
    expect(await repository.findById('org-2', snapshot.id)).toBeNull();
  });

  it('findByCategory returns an empty array for a category with no snapshots', async () => {
    const { repository } = setup();
    const engine = createSnapshotEngine(repository);
    expect(await engine.findByCategory(ORG, 'analytics')).toEqual([]);
  });
});

describe('createSnapshotEngine — additional coverage', () => {
  it('publishes snapshot.created for every one of the 5 categories with the matching category field', async () => {
    const { repository, eventBus } = setup();
    const engine = createSnapshotEngine(repository, {}, eventBus);
    const categoriesSeen: string[] = [];
    eventBus.subscribe('snapshot.created', (payload) => categoriesSeen.push(payload.category));

    for (const category of ['runtime', 'workflows', 'communications', 'analytics', 'security'] as const) {
      await engine.computeSnapshot(ORG, category);
    }

    expect(categoriesSeen).toEqual(['runtime', 'workflows', 'communications', 'analytics', 'security']);
  });

  it('accepts an injectable now() clock', async () => {
    const fixed = '2026-03-01T00:00:00.000Z';
    const repository = createObservabilitySnapshotRepository();
    const engine = createSnapshotEngine(repository, {}, undefined, () => fixed);
    const snapshot = await engine.computeSnapshot(ORG, 'runtime');
    expect(snapshot.computedAt).toBe(fixed);
  });

  it('each computed snapshot for the same category has a distinct id', async () => {
    const { repository } = setup();
    const engine = createSnapshotEngine(repository);
    const first = await engine.computeSnapshot(ORG, 'runtime');
    const second = await engine.computeSnapshot(ORG, 'runtime');
    expect(first.id).not.toBe(second.id);
  });
});
