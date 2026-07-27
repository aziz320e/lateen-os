import { describe, expect, it } from 'vitest';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createObservabilityRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createObservabilityRuntime — fully offline', () => {
  it('wires every service and they are all independently usable', async () => {
    const runtime = createObservabilityRuntime();

    await runtime.logging.info(ORG, 'hello');
    await runtime.metrics.recordGauge(ORG, 'g', 1);
    const trace = await runtime.tracing.startTrace(ORG, 'op');
    await runtime.tracing.endTrace(ORG, trace.id);
    await runtime.health.checkComponentHealth(ORG, 'db', 'healthy');
    await runtime.alerts.checkErrorThreshold(ORG, 1);
    await runtime.performance.recordExecutionTime(ORG);
    await runtime.auditTimeline.aggregateTimeline(ORG);
    await runtime.snapshots.computeSnapshot(ORG, 'runtime');
    expect(await runtime.relationships.getAiRuntimeContext(ORG)).toBeNull();

    expect((await runtime.queries.findLogs({ organizationId: ORG })).total).toBe(1);
  });

  it('accepts an injectable now() clock', async () => {
    const fixed = '2026-01-01T00:00:00.000Z';
    const runtime = createObservabilityRuntime({ now: () => fixed });
    const entry = await runtime.logging.info(ORG, 'hello');
    expect(entry.loggedAt).toBe(fixed);
  });

  it('accepts an injectable event bus', async () => {
    const runtime1 = createObservabilityRuntime();
    const runtime2 = createObservabilityRuntime({ eventBus: runtime1.events });
    let seen = false;
    runtime1.events.subscribe('log.created', () => {
      seen = true;
    });
    await runtime2.logging.info(ORG, 'shared bus');
    expect(seen).toBe(true);
  });
});

describe('createObservabilityRuntime — with a real Workflow Engine collaborator', () => {
  it('propagates the collaborator to Health, Alert, Performance, Audit Timeline, and Snapshot', async () => {
    const workflow = createWorkflowRuntime();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'test.runtime',
      name: 'Test Runtime',
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'work', name: 'Work', type: 'human', optional: false }],
      transitions: [],
    });
    await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    const runtime = createObservabilityRuntime({ workflow });

    const health = await runtime.health.checkWorkflowDependencyHealth(ORG);
    expect(health.status).toBe('healthy');

    const snapshot = await runtime.snapshots.computeSnapshot(ORG, 'workflows');
    expect(snapshot.data.total).toBe(1);

    const timeline = await runtime.auditTimeline.aggregateTimeline(ORG);
    expect(timeline.some((entry) => entry.source === 'workflow')).toBe(true);

    const context = await runtime.relationships.getWorkflowContext(ORG);
    expect(context).toEqual({ waitingTaskCount: 0 });
  });
});

describe('createObservabilityRuntime — isolation between separate runtimes', () => {
  it('two runtimes created without a shared event bus do not observe each other\'s events', async () => {
    const runtime1 = createObservabilityRuntime();
    const runtime2 = createObservabilityRuntime();
    let seen = false;
    runtime1.events.subscribe('log.created', () => {
      seen = true;
    });
    await runtime2.logging.info(ORG, 'isolated');
    expect(seen).toBe(false);
  });

  it('two runtimes do not share repository state', async () => {
    const runtime1 = createObservabilityRuntime();
    const runtime2 = createObservabilityRuntime();
    await runtime1.logging.info(ORG, 'only in runtime1');
    expect((await runtime2.queries.findLogs({ organizationId: ORG })).total).toBe(0);
  });
});

describe('createObservabilityRuntime — exposes exactly the documented service surface', () => {
  it('returns logging, metrics, tracing, health, alerts, performance, auditTimeline, snapshots, relationships, queries, and events', () => {
    const runtime = createObservabilityRuntime();
    expect(Object.keys(runtime).sort()).toEqual(
      ['logging', 'metrics', 'tracing', 'health', 'alerts', 'performance', 'auditTimeline', 'snapshots', 'relationships', 'queries', 'events'].sort(),
    );
  });
});
