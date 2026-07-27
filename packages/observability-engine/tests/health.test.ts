import { describe, expect, it, vi } from 'vitest';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import type { RuntimeQueries } from '@lateen-os/ai-runtime';
import { createObservabilityEventBus } from '../src/events/observability-event-bus.js';
import { createHealthCheckRepository } from '../src/health/repository.impl.js';
import { createHealthEngine } from '../src/health/engine.impl.js';

const ORG = 'org-1';

function setup() {
  const repository = createHealthCheckRepository();
  const eventBus = createObservabilityEventBus();
  return { repository, eventBus };
}

describe('createHealthEngine — checkComponentHealth', () => {
  it('persists a self-reported component health check', async () => {
    const { repository } = setup();
    const engine = createHealthEngine(repository);
    const check = await engine.checkComponentHealth(ORG, 'database', 'healthy');
    expect(check.component).toBe('database');
    expect(check.status).toBe('healthy');
  });

  it('accepts optional details', async () => {
    const { repository } = setup();
    const engine = createHealthEngine(repository);
    const check = await engine.checkComponentHealth(ORG, 'cache', 'degraded', { latencyMs: 500 });
    expect(check.details).toEqual({ latencyMs: 500 });
  });
});

describe('createHealthEngine — health.changed event semantics', () => {
  it('publishes health.changed on the first check for a component', async () => {
    const { repository, eventBus } = setup();
    const engine = createHealthEngine(repository, {}, eventBus);
    const handler = vi.fn();
    eventBus.subscribe('health.changed', handler);
    await engine.checkComponentHealth(ORG, 'database', 'healthy');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not publish health.changed when the status is unchanged', async () => {
    const { repository, eventBus } = setup();
    const engine = createHealthEngine(repository, {}, eventBus);
    await engine.checkComponentHealth(ORG, 'database', 'healthy');
    const handler = vi.fn();
    eventBus.subscribe('health.changed', handler);
    await engine.checkComponentHealth(ORG, 'database', 'healthy');
    expect(handler).not.toHaveBeenCalled();
  });

  it('publishes health.changed when the status transitions', async () => {
    const { repository, eventBus } = setup();
    const engine = createHealthEngine(repository, {}, eventBus);
    await engine.checkComponentHealth(ORG, 'database', 'healthy');
    const handler = vi.fn();
    eventBus.subscribe('health.changed', handler);
    await engine.checkComponentHealth(ORG, 'database', 'degraded');
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG, component: 'database', status: 'degraded' }),
      expect.anything(),
    );
  });
});

describe('createHealthEngine — checkRuntimeHealth', () => {
  it('reports healthy when AI Runtime is not injected', async () => {
    const { repository } = setup();
    const engine = createHealthEngine(repository, {});
    const check = await engine.checkRuntimeHealth(ORG);
    expect(check.status).toBe('healthy');
    expect(check.component).toBe('ai-runtime');
  });

  it('reports healthy for a real, empty AI Runtime state', async () => {
    const { repository } = setup();
    const aiRuntime: Pick<RuntimeQueries, 'findRuntimeState'> = {
      findRuntimeState: async () => ({ state: 'initializing', activeSessionCount: 0, queuedTaskCount: 0 }),
    };
    const engine = createHealthEngine(repository, { aiRuntime });
    const check = await engine.checkRuntimeHealth(ORG);
    expect(check.status).toBe('healthy');
  });

  it('reports degraded when the queued task backlog exceeds 3x active sessions', async () => {
    const { repository } = setup();
    const aiRuntime: Pick<RuntimeQueries, 'findRuntimeState'> = {
      findRuntimeState: async () => ({ state: 'ready', activeSessionCount: 1, queuedTaskCount: 10 }),
    };
    const engine = createHealthEngine(repository, { aiRuntime });
    const check = await engine.checkRuntimeHealth(ORG);
    expect(check.status).toBe('degraded');
  });

  it('reports unhealthy when the runtime state is terminated', async () => {
    const { repository } = setup();
    const aiRuntime: Pick<RuntimeQueries, 'findRuntimeState'> = {
      findRuntimeState: async () => ({ state: 'terminated', activeSessionCount: 0, queuedTaskCount: 0 }),
    };
    const engine = createHealthEngine(repository, { aiRuntime });
    const check = await engine.checkRuntimeHealth(ORG);
    expect(check.status).toBe('unhealthy');
  });
});

describe('createHealthEngine — checkWorkflowDependencyHealth (real Workflow Engine)', () => {
  async function defineAndStart(workflow: ReturnType<typeof createWorkflowRuntime>, code: string) {
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code,
      name: code,
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'work', name: 'Work', type: 'human', optional: false }],
      transitions: [],
    });
    return workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });
  }

  it('reports healthy when there are no failed instances', async () => {
    const workflow = createWorkflowRuntime();
    await defineAndStart(workflow, 'test.a');
    const { repository } = setup();
    const engine = createHealthEngine(repository, { workflow });
    const check = await engine.checkWorkflowDependencyHealth(ORG);
    expect(check.status).toBe('healthy');
  });

  it('reports unhealthy when more than half of instances have failed', async () => {
    const workflow = createWorkflowRuntime();
    const instance = await defineAndStart(workflow, 'test.b');
    await workflow.orchestrator.dispatch({ organizationId: ORG, command: 'fail', instanceId: instance.id, stepId: 'step-1' });

    const { repository } = setup();
    const engine = createHealthEngine(repository, { workflow });
    const check = await engine.checkWorkflowDependencyHealth(ORG);
    expect(check.status).toBe('unhealthy');
  });

  it('reports healthy when Workflow Engine is not injected', async () => {
    const { repository } = setup();
    const engine = createHealthEngine(repository, {});
    const check = await engine.checkWorkflowDependencyHealth(ORG);
    expect(check.status).toBe('healthy');
  });
});

describe('createHealthEngine — get / list / latest / org scoping', () => {
  it('get() returns null for an unknown check', async () => {
    const { repository } = setup();
    const engine = createHealthEngine(repository);
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every recorded check', async () => {
    const { repository } = setup();
    const engine = createHealthEngine(repository);
    await engine.checkComponentHealth(ORG, 'a', 'healthy');
    await engine.checkComponentHealth(ORG, 'b', 'healthy');
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('latest() returns the most recently recorded check for a component', async () => {
    const { repository } = setup();
    const engine = createHealthEngine(repository);
    await engine.checkComponentHealth(ORG, 'database', 'healthy');
    await engine.checkComponentHealth(ORG, 'database', 'degraded');
    const latest = await engine.latest(ORG, 'database');
    expect(latest?.status).toBe('degraded');
  });

  it('latest() returns null when the component has no checks', async () => {
    const { repository } = setup();
    const engine = createHealthEngine(repository);
    expect(await engine.latest(ORG, 'unknown')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { repository } = setup();
    const engine = createHealthEngine(repository);
    const check = await engine.checkComponentHealth(ORG, 'a', 'healthy');
    expect(await repository.findById('org-2', check.id)).toBeNull();
  });
});

describe('createHealthEngine — additional coverage', () => {
  it('reports healthy exactly at the 3x backlog boundary', async () => {
    const { repository } = setup();
    const aiRuntime = { findRuntimeState: async () => ({ state: 'ready' as const, activeSessionCount: 2, queuedTaskCount: 6 }) };
    const engine = createHealthEngine(repository, { aiRuntime });
    const check = await engine.checkRuntimeHealth(ORG);
    expect(check.status).toBe('healthy');
  });

  it('reports degraded just above the 3x backlog boundary', async () => {
    const { repository } = setup();
    const aiRuntime = { findRuntimeState: async () => ({ state: 'ready' as const, activeSessionCount: 2, queuedTaskCount: 7 }) };
    const engine = createHealthEngine(repository, { aiRuntime });
    const check = await engine.checkRuntimeHealth(ORG);
    expect(check.status).toBe('degraded');
  });

  it('checking health for one component does not affect another component\'s change tracking', async () => {
    const { repository, eventBus } = setup();
    const engine = createHealthEngine(repository, {}, eventBus);
    await engine.checkComponentHealth(ORG, 'a', 'healthy');
    await engine.checkComponentHealth(ORG, 'b', 'healthy');
    const handler = vi.fn();
    eventBus.subscribe('health.changed', handler);
    await engine.checkComponentHealth(ORG, 'a', 'healthy');
    expect(handler).not.toHaveBeenCalled();
  });

  it('accepts an injectable now() clock', async () => {
    const fixed = '2026-03-01T00:00:00.000Z';
    const repository = createHealthCheckRepository();
    const engine = createHealthEngine(repository, {}, undefined, () => fixed);
    const check = await engine.checkComponentHealth(ORG, 'db', 'healthy');
    expect(check.checkedAt).toBe(fixed);
  });

  it('workflow dependency health reports healthy when Workflow Engine has no instances at all', async () => {
    const workflow = createWorkflowRuntime();
    const { repository } = setup();
    const engine = createHealthEngine(repository, { workflow });
    const check = await engine.checkWorkflowDependencyHealth(ORG);
    expect(check.status).toBe('healthy');
    expect(check.details).toEqual({ total: 0, failed: 0, failedRatio: 0 });
  });

  it('reports degraded when the queued task count is 0 (no backlog signal)', async () => {
    const { repository } = setup();
    const aiRuntime = { findRuntimeState: async () => ({ state: 'busy' as const, activeSessionCount: 5, queuedTaskCount: 0 }) };
    const engine = createHealthEngine(repository, { aiRuntime });
    const check = await engine.checkRuntimeHealth(ORG);
    expect(check.status).toBe('healthy');
  });

  it('checkComponentHealth records details verbatim', async () => {
    const { repository } = setup();
    const engine = createHealthEngine(repository);
    const check = await engine.checkComponentHealth(ORG, 'queue', 'unhealthy', { backlogSize: 1000 });
    expect(check.details).toEqual({ backlogSize: 1000 });
  });

  it('get() returns a previously recorded check', async () => {
    const { repository } = setup();
    const engine = createHealthEngine(repository);
    const check = await engine.checkComponentHealth(ORG, 'db', 'healthy');
    expect(await engine.get(ORG, check.id)).toEqual(check);
  });
});
