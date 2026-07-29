/**
 * Real Metrics engine — Request Metrics (immutable per-request
 * records) and Health Endpoints (deterministic service-health
 * aggregation). Every aggregate here is fixed arithmetic over stored
 * records — no sampling, no estimation.
 *
 * @module metrics/engine.impl
 */
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { HttpMethod } from '../shared/primitives.js';
import type { HealthSnapshotRepository, RequestMetricRepository } from './repository.js';
import type { HealthSnapshot, RequestMetric } from './types.js';

/** Mean duration in milliseconds; `0` for an empty list. */
export function computeAverageDurationMs(metrics: readonly RequestMetric[]): number {
  if (metrics.length === 0) return 0;
  return Math.round(metrics.reduce((total, metric) => total + metric.durationMs, 0) / metrics.length);
}

/** Fraction of requests with a `statusCode >= 400`, rounded to 4 decimal places; `0` for an empty list. */
export function computeErrorRate(metrics: readonly RequestMetric[]): number {
  if (metrics.length === 0) return 0;
  const errorCount = metrics.filter((metric) => metric.statusCode >= 400).length;
  return Math.round((errorCount / metrics.length) * 10000) / 10000;
}

export interface RecordRequestMetricInput {
  readonly correlationId: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly statusCode: number;
  readonly durationMs: number;
}

export interface RecordHealthCheckInput {
  readonly serviceName: string;
  readonly healthy: boolean;
}

export interface OverallHealth {
  readonly healthy: boolean;
  readonly checkedServices: number;
  readonly unhealthyServices: readonly string[];
}

export interface MetricsEngine {
  recordRequestMetric(organizationId: OrganizationId, input: RecordRequestMetricInput): Promise<RequestMetric>;
  computeAverageDurationForPath(organizationId: OrganizationId, path?: string): Promise<number>;
  computeErrorRateOverall(organizationId: OrganizationId): Promise<number>;
  listMetrics(organizationId: OrganizationId): Promise<readonly RequestMetric[]>;
  findMetricsByPath(organizationId: OrganizationId, path: string): Promise<readonly RequestMetric[]>;

  recordHealthCheck(organizationId: OrganizationId, input: RecordHealthCheckInput): Promise<HealthSnapshot>;
  getLatestServiceHealth(organizationId: OrganizationId, serviceName: string): Promise<HealthSnapshot | null>;
  getOverallHealth(organizationId: OrganizationId): Promise<OverallHealth>;
  listHealthSnapshots(organizationId: OrganizationId): Promise<readonly HealthSnapshot[]>;
}

/** Creates a real {@link MetricsEngine}. */
export function createMetricsEngine(
  metricRepository: RequestMetricRepository,
  healthRepository: HealthSnapshotRepository,
  now: () => string = nowIso,
): MetricsEngine {
  return {
    async recordRequestMetric(organizationId, input) {
      const timestamp = now();
      const metric: RequestMetric = {
        id: generateId('gateway-metric'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        correlationId: input.correlationId,
        method: input.method,
        path: input.path,
        statusCode: input.statusCode,
        durationMs: input.durationMs,
      };
      await metricRepository.save(metric);
      return metric;
    },

    async computeAverageDurationForPath(organizationId, path) {
      const metrics = path ? await metricRepository.findByPath(organizationId, path) : await metricRepository.findAll(organizationId);
      return computeAverageDurationMs(metrics);
    },

    async computeErrorRateOverall(organizationId) {
      return computeErrorRate(await metricRepository.findAll(organizationId));
    },

    async listMetrics(organizationId) {
      return metricRepository.findAll(organizationId);
    },

    async findMetricsByPath(organizationId, path) {
      return metricRepository.findByPath(organizationId, path);
    },

    async recordHealthCheck(organizationId, input) {
      const timestamp = now();
      const snapshot: HealthSnapshot = {
        id: generateId('gateway-health'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        serviceName: input.serviceName,
        healthy: input.healthy,
        checkedAt: timestamp,
      };
      await healthRepository.save(snapshot);
      return snapshot;
    },

    async getLatestServiceHealth(organizationId, serviceName) {
      const snapshots = await healthRepository.findByService(organizationId, serviceName);
      if (snapshots.length === 0) return null;
      return snapshots.reduce((latest, candidate) => (candidate.checkedAt >= latest.checkedAt ? candidate : latest));
    },

    async getOverallHealth(organizationId) {
      const snapshots = await healthRepository.findAll(organizationId);
      const latestByService = new Map<string, HealthSnapshot>();
      for (const snapshot of snapshots) {
        const existing = latestByService.get(snapshot.serviceName);
        if (!existing || snapshot.checkedAt >= existing.checkedAt) latestByService.set(snapshot.serviceName, snapshot);
      }
      const unhealthyServices = [...latestByService.values()].filter((snapshot) => !snapshot.healthy).map((snapshot) => snapshot.serviceName);
      return { healthy: unhealthyServices.length === 0, checkedServices: latestByService.size, unhealthyServices };
    },

    async listHealthSnapshots(organizationId) {
      return healthRepository.findAll(organizationId);
    },
  };
}
