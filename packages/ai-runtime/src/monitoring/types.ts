/** @module monitoring/types */
import type { OrganizationId, RuntimeAgentId, RuntimeSessionId } from '../shared/identifiers.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/** Runtime-wide metrics snapshot. */
export interface RuntimeMetrics {
  readonly organizationId: OrganizationId;
  readonly activeSessions: number;
  readonly queuedTasks: number;
  readonly runningTasks: number;
  readonly collectedAt: Timestamp;
}

/** Per-execution metrics. */
export interface ExecutionMetrics {
  readonly sessionId: RuntimeSessionId;
  readonly runtimeAgentId: RuntimeAgentId;
  readonly durationMs: number;
  readonly toolCallCount: number;
  readonly success: boolean;
  readonly recordedAt: Timestamp;
}
