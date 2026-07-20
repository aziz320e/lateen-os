/** @module health/types */
export type HealthStatus = 'ok' | 'degraded' | 'down';

export type ProbeKind = 'liveness' | 'readiness' | 'dependency';

export interface HealthProbeResult {
  readonly name: string;
  readonly kind: ProbeKind;
  readonly url: string;
  readonly status: HealthStatus;
  readonly detail?: string;
  readonly durationMs: number;
}

export interface PlatformHealthReport {
  readonly status: HealthStatus;
  readonly checkedAt: string;
  readonly liveness: readonly HealthProbeResult[];
  readonly readiness: readonly HealthProbeResult[];
  readonly dependencies: readonly HealthProbeResult[];
}
