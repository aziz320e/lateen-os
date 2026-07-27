/**
 * Real Alert Engine — deterministic alerts for error thresholds, warning
 * thresholds, inactivity, health degradation, workflow failures, and
 * security events. Composes the real, optional Logging/Health engines
 * (same package) and the real, optional Workflow Engine / AI Security
 * Engine query ports (never a repository).
 *
 * @module alerting/engine.impl
 */
import type { SecurityRuntime } from '@lateen-os/ai-security-engine';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';
import type { ObservabilityEventBus } from '../events/observability-event-bus.js';
import type { HealthCheck } from '../health/types.js';
import type { LogEntry } from '../logging/types.js';
import { AlertNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AlertId, OrganizationId } from '../shared/identifiers.js';
import type { AlertRepository } from './repository.js';
import type { Alert, AlertSeverity, AlertType } from './types.js';

export interface AlertEngineDeps {
  readonly logging?: { list(organizationId: OrganizationId): Promise<readonly LogEntry[]> };
  readonly health?: { list(organizationId: OrganizationId): Promise<readonly HealthCheck[]> };
  readonly workflow?: Pick<WorkflowRuntime, 'queries'>;
  readonly aiSecurity?: Pick<SecurityRuntime, 'queries'>;
}

/**
 * Latest health check per component, favoring the latest insert on a
 * timestamp tie. Iterates oldest-to-newest (stable sort preserves
 * insertion order on ties) and lets each later check overwrite its
 * component's entry in the map, so the final value is always the most
 * recently inserted check.
 */
function latestPerComponent(checks: readonly HealthCheck[]): readonly HealthCheck[] {
  const byComponent = new Map<string, HealthCheck>();
  for (const check of [...checks].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))) {
    byComponent.set(check.component, check);
  }
  return Array.from(byComponent.values());
}

export interface AlertEngine {
  checkErrorThreshold(organizationId: OrganizationId, thresholdCount: number): Promise<Alert | null>;
  checkWarningThreshold(organizationId: OrganizationId, thresholdCount: number): Promise<Alert | null>;
  checkInactivity(organizationId: OrganizationId, inactivityMinutesThreshold: number): Promise<Alert | null>;
  checkHealthDegradation(organizationId: OrganizationId): Promise<readonly Alert[]>;
  checkWorkflowFailures(organizationId: OrganizationId): Promise<Alert | null>;
  checkSecurityEvents(organizationId: OrganizationId, thresholdCount: number): Promise<Alert | null>;
  resolve(organizationId: OrganizationId, alertId: AlertId): Promise<Alert>;
  get(organizationId: OrganizationId, alertId: AlertId): Promise<Alert | null>;
  list(organizationId: OrganizationId): Promise<readonly Alert[]>;
  findOpen(organizationId: OrganizationId): Promise<readonly Alert[]>;
}

/** Creates a real {@link AlertEngine} over the given repository and optional collaborators. */
export function createAlertEngine(
  repository: AlertRepository,
  deps: AlertEngineDeps = {},
  eventBus?: ObservabilityEventBus,
  now: () => string = nowIso,
): AlertEngine {
  async function trigger(organizationId: OrganizationId, alertType: AlertType, severity: AlertSeverity, message: string, context?: Readonly<Record<string, unknown>>): Promise<Alert> {
    const timestamp = now();
    const alert: Alert = {
      id: generateId('alert'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      alertType,
      severity,
      message,
      status: 'open',
      context,
      triggeredAt: timestamp,
    };
    await repository.save(alert);
    eventBus?.publish('alert.created', { organizationId, alertId: alert.id, alertType, severity });
    return alert;
  }

  return {
    async checkErrorThreshold(organizationId, thresholdCount) {
      if (!deps.logging) return null;
      const entries = await deps.logging.list(organizationId);
      const count = entries.filter((entry) => entry.level === 'error' || entry.level === 'fatal').length;
      if (count < thresholdCount) return null;
      return trigger(organizationId, 'error_threshold', 'critical', `${count} error/fatal log entries recorded (threshold ${thresholdCount})`, { count, thresholdCount });
    },

    async checkWarningThreshold(organizationId, thresholdCount) {
      if (!deps.logging) return null;
      const entries = await deps.logging.list(organizationId);
      const count = entries.filter((entry) => entry.level === 'warn').length;
      if (count < thresholdCount) return null;
      return trigger(organizationId, 'warning_threshold', 'warning', `${count} warning log entries recorded (threshold ${thresholdCount})`, { count, thresholdCount });
    },

    async checkInactivity(organizationId, inactivityMinutesThreshold) {
      if (!deps.logging) return null;
      const entries = await deps.logging.list(organizationId);
      if (entries.length === 0) {
        return trigger(organizationId, 'inactivity', 'warning', 'No log entries recorded', { inactivityMinutesThreshold });
      }
      const latest = [...entries].reverse().sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))[0]!;
      const idleMinutes = (new Date(now()).getTime() - new Date(latest.loggedAt).getTime()) / 60_000;
      if (idleMinutes < inactivityMinutesThreshold) return null;
      return trigger(organizationId, 'inactivity', 'warning', `No log activity for ${Math.round(idleMinutes)} minutes (threshold ${inactivityMinutesThreshold})`, { idleMinutes, inactivityMinutesThreshold });
    },

    async checkHealthDegradation(organizationId) {
      if (!deps.health) return [];
      const latest = latestPerComponent(await deps.health.list(organizationId));
      const degraded = latest.filter((check) => check.status !== 'healthy');
      const alerts: Alert[] = [];
      for (const check of degraded) {
        alerts.push(
          await trigger(
            organizationId,
            'health_degradation',
            check.status === 'unhealthy' ? 'critical' : 'warning',
            `Component "${check.component}" is ${check.status}`,
            { component: check.component, status: check.status },
          ),
        );
      }
      return alerts;
    },

    async checkWorkflowFailures(organizationId) {
      if (!deps.workflow) return null;
      const { total } = await deps.workflow.queries.findRunningWorkflows({ organizationId, status: 'failed' });
      if (total === 0) return null;
      return trigger(organizationId, 'workflow_failure', 'critical', `${total} failed workflow instance(s) detected`, { total });
    },

    async checkSecurityEvents(organizationId, thresholdCount) {
      if (!deps.aiSecurity) return null;
      const { total } = await deps.aiSecurity.queries.findViolations({ organizationId });
      if (total < thresholdCount) return null;
      return trigger(organizationId, 'security_event', 'critical', `${total} security violation(s) recorded (threshold ${thresholdCount})`, { total, thresholdCount });
    },

    async resolve(organizationId, alertId) {
      const alert = await repository.findById(organizationId, alertId);
      if (!alert) throw new AlertNotFoundError(alertId);
      const resolved: Alert = { ...alert, updatedAt: now(), status: 'resolved', resolvedAt: now() };
      await repository.save(resolved);
      eventBus?.publish('alert.resolved', { organizationId, alertId });
      return resolved;
    },

    async get(organizationId, alertId) {
      return repository.findById(organizationId, alertId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findOpen(organizationId) {
      return repository.findByStatus(organizationId, 'open');
    },
  };
}
