/** @module alerting/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AlertId } from '../shared/identifiers.js';

export type { AlertId };

/** The six deterministic alert types supported by the Alert Engine. */
export type AlertType = 'error_threshold' | 'warning_threshold' | 'inactivity' | 'health_degradation' | 'workflow_failure' | 'security_event';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'open' | 'resolved';

/** A single, deterministic alert. */
export interface Alert extends TenantAuditableEntity<AlertId> {
  readonly alertType: AlertType;
  readonly severity: AlertSeverity;
  readonly message: string;
  readonly status: AlertStatus;
  readonly context?: Readonly<Record<string, unknown>>;
  readonly triggeredAt: string;
  readonly resolvedAt?: string;
}
