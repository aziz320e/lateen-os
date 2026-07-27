import { describe, expect, it, vi } from 'vitest';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createObservabilityEventBus } from '../src/events/observability-event-bus.js';
import { createLogEntryRepository } from '../src/logging/repository.impl.js';
import { createLoggingEngine } from '../src/logging/engine.impl.js';
import { createHealthCheckRepository } from '../src/health/repository.impl.js';
import { createHealthEngine } from '../src/health/engine.impl.js';
import { createAlertRepository } from '../src/alerting/repository.impl.js';
import { createAlertEngine } from '../src/alerting/engine.impl.js';
import { AlertNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const repository = createAlertRepository();
  const eventBus = createObservabilityEventBus();
  const loggingRepository = createLogEntryRepository();
  const logging = createLoggingEngine(loggingRepository);
  const healthRepository = createHealthCheckRepository();
  const health = createHealthEngine(healthRepository);
  return { repository, eventBus, logging, health };
}

describe('createAlertEngine — checkErrorThreshold', () => {
  it('returns null when Logging is not injected', async () => {
    const { repository } = setup();
    const engine = createAlertEngine(repository);
    expect(await engine.checkErrorThreshold(ORG, 1)).toBeNull();
  });

  it('returns null when the error count is below the threshold', async () => {
    const { repository, logging } = setup();
    await logging.error(ORG, 'oops');
    const engine = createAlertEngine(repository, { logging });
    expect(await engine.checkErrorThreshold(ORG, 3)).toBeNull();
  });

  it('creates a critical alert when the error+fatal count meets the threshold', async () => {
    const { repository, logging, eventBus } = setup();
    await logging.error(ORG, 'e1');
    await logging.fatal(ORG, 'f1');
    const engine = createAlertEngine(repository, { logging }, eventBus);
    const alert = await engine.checkErrorThreshold(ORG, 2);
    expect(alert?.alertType).toBe('error_threshold');
    expect(alert?.severity).toBe('critical');
    expect(alert?.status).toBe('open');
  });

  it('publishes alert.created', async () => {
    const { repository, logging, eventBus } = setup();
    await logging.error(ORG, 'e1');
    const handler = vi.fn();
    eventBus.subscribe('alert.created', handler);
    const engine = createAlertEngine(repository, { logging }, eventBus);
    await engine.checkErrorThreshold(ORG, 1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG, alertType: 'error_threshold', severity: 'critical' }),
      expect.anything(),
    );
  });
});

describe('createAlertEngine — checkWarningThreshold', () => {
  it('returns null when Logging is not injected', async () => {
    const { repository } = setup();
    const engine = createAlertEngine(repository);
    expect(await engine.checkWarningThreshold(ORG, 1)).toBeNull();
  });

  it('creates a warning alert when the warn count meets the threshold', async () => {
    const { repository, logging } = setup();
    await logging.warn(ORG, 'w1');
    await logging.warn(ORG, 'w2');
    const engine = createAlertEngine(repository, { logging });
    const alert = await engine.checkWarningThreshold(ORG, 2);
    expect(alert?.alertType).toBe('warning_threshold');
    expect(alert?.severity).toBe('warning');
  });

  it('returns null below threshold', async () => {
    const { repository, logging } = setup();
    await logging.warn(ORG, 'w1');
    const engine = createAlertEngine(repository, { logging });
    expect(await engine.checkWarningThreshold(ORG, 5)).toBeNull();
  });
});

describe('createAlertEngine — checkInactivity', () => {
  it('returns null when Logging is not injected', async () => {
    const { repository } = setup();
    const engine = createAlertEngine(repository);
    expect(await engine.checkInactivity(ORG, 10)).toBeNull();
  });

  it('creates an alert when there are no log entries at all', async () => {
    const { repository, logging } = setup();
    const engine = createAlertEngine(repository, { logging });
    const alert = await engine.checkInactivity(ORG, 10);
    expect(alert?.alertType).toBe('inactivity');
  });

  it('returns null when the most recent log is within the threshold', async () => {
    const { repository, logging } = setup();
    await logging.info(ORG, 'recent');
    const engine = createAlertEngine(repository, { logging });
    expect(await engine.checkInactivity(ORG, 60)).toBeNull();
  });

  it('creates an alert when the most recent log is older than the threshold', async () => {
    const past = '2020-01-01T00:00:00.000Z';
    const later = '2020-01-01T01:00:00.000Z';
    const { repository } = setup();
    const logging = createLoggingEngine(createLogEntryRepository(), undefined, () => past);
    await logging.info(ORG, 'stale');
    const engine = createAlertEngine(repository, { logging }, undefined, () => later);
    const alert = await engine.checkInactivity(ORG, 10);
    expect(alert?.alertType).toBe('inactivity');
  });
});

describe('createAlertEngine — checkHealthDegradation', () => {
  it('returns an empty array when Health is not injected', async () => {
    const { repository } = setup();
    const engine = createAlertEngine(repository);
    expect(await engine.checkHealthDegradation(ORG)).toEqual([]);
  });

  it('returns an empty array when every component is healthy', async () => {
    const { repository, health } = setup();
    await health.checkComponentHealth(ORG, 'database', 'healthy');
    const engine = createAlertEngine(repository, { health });
    expect(await engine.checkHealthDegradation(ORG)).toEqual([]);
  });

  it('creates a critical alert for an unhealthy component and a warning alert for a degraded one', async () => {
    const { repository, health } = setup();
    await health.checkComponentHealth(ORG, 'database', 'unhealthy');
    await health.checkComponentHealth(ORG, 'cache', 'degraded');
    const engine = createAlertEngine(repository, { health });
    const alerts = await engine.checkHealthDegradation(ORG);
    expect(alerts).toHaveLength(2);
    expect(alerts.find((a) => a.context?.component === 'database')?.severity).toBe('critical');
    expect(alerts.find((a) => a.context?.component === 'cache')?.severity).toBe('warning');
  });

  it('only considers the latest check per component', async () => {
    const { repository, health } = setup();
    await health.checkComponentHealth(ORG, 'database', 'unhealthy');
    await health.checkComponentHealth(ORG, 'database', 'healthy');
    const engine = createAlertEngine(repository, { health });
    expect(await engine.checkHealthDegradation(ORG)).toEqual([]);
  });
});

describe('createAlertEngine — checkWorkflowFailures (real Workflow Engine)', () => {
  it('returns null when Workflow Engine is not injected', async () => {
    const { repository } = setup();
    const engine = createAlertEngine(repository);
    expect(await engine.checkWorkflowFailures(ORG)).toBeNull();
  });

  it('returns null when there are no failed instances', async () => {
    const workflow = createWorkflowRuntime();
    const { repository } = setup();
    const engine = createAlertEngine(repository, { workflow });
    expect(await engine.checkWorkflowFailures(ORG)).toBeNull();
  });

  it('creates a critical alert when a workflow instance has failed', async () => {
    const workflow = createWorkflowRuntime();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'test.fail',
      name: 'Test Fail',
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'work', name: 'Work', type: 'human', optional: false }],
      transitions: [],
    });
    const instance = await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    await workflow.orchestrator.dispatch({ organizationId: ORG, command: 'fail', instanceId: instance.id, stepId: 'step-1' });

    const { repository } = setup();
    const engine = createAlertEngine(repository, { workflow });
    const alert = await engine.checkWorkflowFailures(ORG);
    expect(alert?.alertType).toBe('workflow_failure');
    expect(alert?.severity).toBe('critical');
  });
});

describe('createAlertEngine — checkSecurityEvents (real AI Security Engine)', () => {
  it('returns null when AI Security Engine is not injected', async () => {
    const { repository } = setup();
    const engine = createAlertEngine(repository);
    expect(await engine.checkSecurityEvents(ORG, 1)).toBeNull();
  });

  it('returns null when the violation count is below the threshold', async () => {
    const aiSecurity = createSecurityRuntime();
    const { repository } = setup();
    const engine = createAlertEngine(repository, { aiSecurity });
    expect(await engine.checkSecurityEvents(ORG, 1)).toBeNull();
  });

  it('creates a critical alert when the real violation count meets the threshold', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authentication.validateToken(ORG, 'not-a-real-token');
    const { repository } = setup();
    const engine = createAlertEngine(repository, { aiSecurity });
    const alert = await engine.checkSecurityEvents(ORG, 1);
    expect(alert?.alertType).toBe('security_event');
    expect(alert?.severity).toBe('critical');
  });
});

describe('createAlertEngine — resolve / get / list / findOpen', () => {
  it('resolve() transitions status and publishes alert.resolved', async () => {
    const { repository, logging, eventBus } = setup();
    await logging.error(ORG, 'e');
    const engine = createAlertEngine(repository, { logging }, eventBus);
    const alert = (await engine.checkErrorThreshold(ORG, 1))!;
    const handler = vi.fn();
    eventBus.subscribe('alert.resolved', handler);
    const resolved = await engine.resolve(ORG, alert.id);
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolvedAt).toBeDefined();
    expect(handler).toHaveBeenCalledWith({ organizationId: ORG, alertId: alert.id }, expect.anything());
  });

  it('resolve() throws AlertNotFoundError for an unknown alert', async () => {
    const { repository } = setup();
    const engine = createAlertEngine(repository);
    await expect(engine.resolve(ORG, 'missing')).rejects.toThrow(AlertNotFoundError);
  });

  it('get() returns null for an unknown alert', async () => {
    const { repository } = setup();
    const engine = createAlertEngine(repository);
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every alert', async () => {
    const { repository, logging } = setup();
    await logging.error(ORG, 'e1');
    await logging.warn(ORG, 'w1');
    const engine = createAlertEngine(repository, { logging });
    await engine.checkErrorThreshold(ORG, 1);
    await engine.checkWarningThreshold(ORG, 1);
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('findOpen() returns only open alerts', async () => {
    const { repository, logging } = setup();
    await logging.error(ORG, 'e1');
    const engine = createAlertEngine(repository, { logging });
    const alert = (await engine.checkErrorThreshold(ORG, 1))!;
    await engine.resolve(ORG, alert.id);
    expect(await engine.findOpen(ORG)).toEqual([]);
  });

  it('is organization-scoped', async () => {
    const { repository, logging } = setup();
    await logging.error(ORG, 'e1');
    const engine = createAlertEngine(repository, { logging });
    const alert = (await engine.checkErrorThreshold(ORG, 1))!;
    expect(await repository.findById('org-2', alert.id)).toBeNull();
  });
});

describe('createAlertEngine — boundary conditions', () => {
  it('checkErrorThreshold triggers exactly at the threshold, not only above it', async () => {
    const { repository, logging } = setup();
    await logging.error(ORG, 'e1');
    await logging.error(ORG, 'e2');
    await logging.error(ORG, 'e3');
    const engine = createAlertEngine(repository, { logging });
    const alert = await engine.checkErrorThreshold(ORG, 3);
    expect(alert).not.toBeNull();
  });

  it('checkSecurityEvents does not trigger one below the threshold', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authentication.validateToken(ORG, 'bad-1');
    const { repository } = setup();
    const engine = createAlertEngine(repository, { aiSecurity });
    expect(await engine.checkSecurityEvents(ORG, 2)).toBeNull();
  });

  it('checkWarningThreshold ignores error-level entries', async () => {
    const { repository, logging } = setup();
    await logging.error(ORG, 'e1');
    const engine = createAlertEngine(repository, { logging });
    expect(await engine.checkWarningThreshold(ORG, 1)).toBeNull();
  });

  it('checkErrorThreshold ignores warn-level entries', async () => {
    const { repository, logging } = setup();
    await logging.warn(ORG, 'w1');
    const engine = createAlertEngine(repository, { logging });
    expect(await engine.checkErrorThreshold(ORG, 1)).toBeNull();
  });

  it('accepts an injectable now() clock for triggeredAt', async () => {
    const fixed = '2026-03-01T00:00:00.000Z';
    const { repository, logging } = setup();
    await logging.error(ORG, 'e1');
    const engine = createAlertEngine(repository, { logging }, undefined, () => fixed);
    const alert = await engine.checkErrorThreshold(ORG, 1);
    expect(alert?.triggeredAt).toBe(fixed);
  });

  it('list() returns an empty array when no checks have triggered an alert', async () => {
    const { repository } = setup();
    const engine = createAlertEngine(repository);
    expect(await engine.list(ORG)).toEqual([]);
  });
});
