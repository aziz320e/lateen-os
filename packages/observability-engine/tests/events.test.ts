import { describe, expect, it, vi } from 'vitest';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createObservabilityEventBus } from '../src/events/observability-event-bus.js';
import { OBSERVABILITY_EVENT_NAMES } from '../src/events/observability-events.js';
import { createObservabilityRuntime } from '../src/runtime.js';

describe('OBSERVABILITY_EVENT_NAMES', () => {
  it('declares exactly the 7 required event names', () => {
    expect(Object.values(OBSERVABILITY_EVENT_NAMES).sort()).toEqual(
      ['log.created', 'metric.updated', 'trace.completed', 'alert.created', 'alert.resolved', 'health.changed', 'snapshot.created'].sort(),
    );
  });
});

describe('createObservabilityEventBus', () => {
  it('dispatches to subscribers of the exact event name only', () => {
    const eventBus = createObservabilityEventBus();
    const logCreated = vi.fn();
    const alertCreated = vi.fn();
    eventBus.subscribe('log.created', logCreated);
    eventBus.subscribe('alert.created', alertCreated);

    eventBus.publish('log.created', { organizationId: 'org-1', logEntryId: 'l1', level: 'info', category: 'x' });

    expect(logCreated).toHaveBeenCalledTimes(1);
    expect(alertCreated).not.toHaveBeenCalled();
  });
});

describe('end-to-end event flow through createObservabilityRuntime()', () => {
  it('every declared event is genuinely published by the real service that causes it', async () => {
    const workflow = createWorkflowRuntime();
    const runtime = createObservabilityRuntime({ workflow });
    const seen: string[] = [];
    for (const eventName of Object.values(OBSERVABILITY_EVENT_NAMES)) {
      runtime.events.subscribe(eventName, () => seen.push(eventName));
    }

    const ORG = 'org-1';

    await runtime.logging.info(ORG, 'hello');
    await runtime.metrics.recordGauge(ORG, 'g', 1);
    const trace = await runtime.tracing.startTrace(ORG, 'op');
    await runtime.tracing.endTrace(ORG, trace.id);
    await runtime.health.checkComponentHealth(ORG, 'db', 'healthy');
    await runtime.health.checkComponentHealth(ORG, 'db', 'degraded');
    await runtime.snapshots.computeSnapshot(ORG, 'runtime');

    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'test.events',
      name: 'Test Events',
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'work', name: 'Work', type: 'human', optional: false }],
      transitions: [],
    });
    const instance = await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    await workflow.orchestrator.dispatch({ organizationId: ORG, command: 'fail', instanceId: instance.id, stepId: 'step-1' });
    const alert = await runtime.alerts.checkWorkflowFailures(ORG);
    await runtime.alerts.resolve(ORG, alert!.id);

    await Promise.resolve();

    expect(new Set(seen)).toEqual(new Set(Object.values(OBSERVABILITY_EVENT_NAMES)));
  });
});

describe('createObservabilityEventBus — unsubscribe and wildcard', () => {
  it('unsubscribe stops further delivery', () => {
    const eventBus = createObservabilityEventBus();
    const handler = vi.fn();
    const unsubscribe = eventBus.subscribe('log.created', handler);
    unsubscribe();
    eventBus.publish('log.created', { organizationId: 'org-1', logEntryId: 'l1', level: 'info', category: 'x' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('subscribeAll receives every published event regardless of name', () => {
    const eventBus = createObservabilityEventBus();
    const handler = vi.fn();
    eventBus.subscribeAll(handler);
    eventBus.publish('log.created', { organizationId: 'org-1', logEntryId: 'l1', level: 'info', category: 'x' });
    eventBus.publish('metric.updated', { organizationId: 'org-1', metricSampleId: 'm1', metricName: 'g', metricType: 'gauge' });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('publish includes event metadata with the event name and a timestamp', () => {
    const eventBus = createObservabilityEventBus();
    let meta: { name: string; timestamp: string } | undefined;
    eventBus.subscribe('log.created', (_payload, m) => {
      meta = m;
    });
    eventBus.publish('log.created', { organizationId: 'org-1', logEntryId: 'l1', level: 'info', category: 'x' });
    expect(meta?.name).toBe('log.created');
    expect(new Date(meta!.timestamp).toISOString()).toBe(meta!.timestamp);
  });
});
