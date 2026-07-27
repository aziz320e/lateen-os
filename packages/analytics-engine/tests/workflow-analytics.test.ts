import { describe, expect, it } from 'vitest';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createWorkflowAnalyticsRepository } from '../src/workflow-analytics/repository.impl.js';
import { computeAverageExecutionTimeMinutes, createWorkflowAnalyticsEngine } from '../src/workflow-analytics/engine.impl.js';

const ORG = 'org-1';

describe('computeAverageExecutionTimeMinutes (pure)', () => {
  it('averages minutes between startedAt and completedAt', () => {
    const minutes = computeAverageExecutionTimeMinutes([
      { startedAt: '2026-01-01T00:00:00.000Z', completedAt: '2026-01-01T00:30:00.000Z' },
      { startedAt: '2026-01-01T00:00:00.000Z', completedAt: '2026-01-01T01:00:00.000Z' },
    ]);
    expect(minutes).toBe(45);
  });

  it('ignores instances with no completedAt', () => {
    expect(computeAverageExecutionTimeMinutes([{ startedAt: '2026-01-01T00:00:00.000Z' }])).toBe(0);
  });

  it('returns 0 for an empty array', () => {
    expect(computeAverageExecutionTimeMinutes([])).toBe(0);
  });
});

function setup() {
  const repository = createWorkflowAnalyticsRepository();
  return { repository };
}

describe('createWorkflowAnalyticsEngine — fully offline (no Workflow Engine injected)', () => {
  it('returns a zeroed snapshot', async () => {
    const { repository } = setup();
    const engine = createWorkflowAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.activeWorkflows).toBe(0);
    expect(snapshot.bottlenecks).toEqual({});
  });
});

describe('createWorkflowAnalyticsEngine — with a real Workflow Engine', () => {
  async function seedRunningWorkflow() {
    const workflow = createWorkflowRuntime();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'test.review',
      name: 'Test Review',
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'review', name: 'Review', type: 'human', optional: false }],
      transitions: [],
    });
    await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    return { workflow };
  }

  it('counts real active (non-terminal) workflow instances', async () => {
    const { workflow } = await seedRunningWorkflow();
    const { repository } = setup();
    const engine = createWorkflowAnalyticsEngine(repository, { workflow });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.activeWorkflows).toBeGreaterThanOrEqual(1);
    expect(snapshot.completedWorkflows).toBe(0);
    expect(snapshot.failedWorkflows).toBe(0);
  });

  it('counts real waiting step instances as bottlenecks', async () => {
    // Only Workflow Engine's `wait` step type reaches a real `'waiting'`
    // step-instance status immediately on dispatch — a `human` step (as
    // used by the other tests in this suite) stays `'active'` until an
    // external `complete`/`fail` dispatch, so it would never surface here.
    const workflow = createWorkflowRuntime();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'test.delay',
      name: 'Test Delay',
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'delay', name: 'Delay', type: 'wait', optional: false, durationMs: 60_000 }],
      transitions: [],
    });
    await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    const { repository } = setup();
    const engine = createWorkflowAnalyticsEngine(repository, { workflow });
    const snapshot = await engine.computeSnapshot(ORG);
    const totalBottlenecked = Object.values(snapshot.bottlenecks).reduce((sum, count) => sum + count, 0);
    expect(totalBottlenecked).toBeGreaterThanOrEqual(1);
  });
});

describe('createWorkflowAnalyticsEngine — get / list / org scoping', () => {
  it('get() returns null for an unknown snapshot', async () => {
    const { repository } = setup();
    const engine = createWorkflowAnalyticsEngine(repository, {});
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every computed snapshot', async () => {
    const { repository } = setup();
    const engine = createWorkflowAnalyticsEngine(repository, {});
    await engine.computeSnapshot(ORG);
    await engine.computeSnapshot(ORG);
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { repository } = setup();
    const engine = createWorkflowAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG);
    expect(await repository.findById('org-2', snapshot.id)).toBeNull();
  });
});
