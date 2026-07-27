/**
 * Real Performance Engine — tracks mission outcomes per worker and
 * computes success/failure rate, average execution time, quality score,
 * and reliability score. State lives in a per-instance ledger created by
 * {@link createPerformanceEngine} (dependency-injected, never a module
 * singleton) and is mirrored into {@link PerformanceMetricsRepository} as
 * a daily snapshot.
 *
 * @module performance/performance-engine.impl
 */
import type { WorkforceEventBus } from '../events/workforce-event-bus.js';
import { nowIso } from '../shared/id.js';
import type { OrganizationId, TaskId, WorkerId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';
import type { PerformanceMetricsRepository } from './repository.js';
import type { TaskStatistics, WorkerScore } from './types.js';

interface WorkerLedgerEntry {
  totalCompleted: number;
  totalFailed: number;
  totalCancelled: number;
  totalDurationMinutes: number;
  qualityScores: number[];
  recentTaskIds: string[];
}

function emptyLedgerEntry(): WorkerLedgerEntry {
  return { totalCompleted: 0, totalFailed: 0, totalCancelled: 0, totalDurationMinutes: 0, qualityScores: [], recentTaskIds: [] };
}

function toFixedScore(value: number): ScoreValue {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)).toFixed(2) : '0.00';
}

/** Formats a non-score decimal (e.g. a duration in minutes) without clamping to [0,1]. */
function toDecimalString(value: number): ScoreValue {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

export interface PerformanceEngine {
  recordSuccess(
    organizationId: OrganizationId,
    workerId: WorkerId,
    durationMinutes: number,
    qualityScore?: ScoreValue,
    taskId?: TaskId,
  ): Promise<WorkerScore>;
  recordFailure(organizationId: OrganizationId, workerId: WorkerId, durationMinutes: number, taskId?: TaskId): Promise<WorkerScore>;
  getStatistics(organizationId: OrganizationId, workerId: WorkerId): TaskStatistics;
  getScore(organizationId: OrganizationId, workerId: WorkerId): WorkerScore;
}

/** Creates a real {@link PerformanceEngine} over a per-instance ledger and {@link PerformanceMetricsRepository}. */
export function createPerformanceEngine(
  repository: PerformanceMetricsRepository,
  eventBus?: WorkforceEventBus,
  now: () => string = nowIso,
): PerformanceEngine {
  const ledger = new Map<string, WorkerLedgerEntry>();

  function entryFor(workerId: WorkerId): WorkerLedgerEntry {
    const existing = ledger.get(workerId);
    if (existing) return existing;
    const created = emptyLedgerEntry();
    ledger.set(workerId, created);
    return created;
  }

  function computeScore(workerId: WorkerId, entry: WorkerLedgerEntry): WorkerScore {
    const missionCount = entry.totalCompleted + entry.totalFailed;
    const successRate = missionCount > 0 ? entry.totalCompleted / missionCount : 0;
    const reliabilityScore = successRate;
    const qualityScore =
      entry.qualityScores.length > 0
        ? entry.qualityScores.reduce((sum, value) => sum + value, 0) / entry.qualityScores.length
        : successRate;

    return {
      workerId,
      overallScore: toFixedScore((successRate + qualityScore + reliabilityScore + 1) / 4),
      productivityScore: toFixedScore(successRate),
      qualityScore: toFixedScore(qualityScore),
      collaborationScore: toFixedScore(reliabilityScore),
      governanceScore: '1.00',
      calculatedAt: now(),
    };
  }

  async function upsertDailySnapshot(organizationId: OrganizationId, workerId: WorkerId, entry: WorkerLedgerEntry): Promise<void> {
    const timestamp = now();
    const periodStart = timestamp.slice(0, 10);
    const missionCount = entry.totalCompleted + entry.totalFailed;
    const existing = (await repository.findByWorker(organizationId, workerId)).find(
      (metrics) => metrics.period === 'daily' && metrics.periodStart.startsWith(periodStart),
    );
    await repository.save({
      id: existing?.id ?? `${workerId}-${periodStart}`,
      organizationId,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      workerId,
      period: 'daily',
      periodStart: existing?.periodStart ?? timestamp,
      periodEnd: timestamp,
      tasksCompleted: entry.totalCompleted,
      tasksFailed: entry.totalFailed,
      averageCompletionMinutes: toDecimalString(missionCount > 0 ? entry.totalDurationMinutes / missionCount : 0),
      goalCompletionRate: toFixedScore(missionCount > 0 ? entry.totalCompleted / missionCount : 0),
      delegationSuccessRate: toFixedScore(missionCount > 0 ? entry.totalCompleted / missionCount : 0),
      supervisorReviewScore: toFixedScore(
        entry.qualityScores.length > 0 ? entry.qualityScores.reduce((sum, value) => sum + value, 0) / entry.qualityScores.length : 0,
      ),
    });
  }

  return {
    async recordSuccess(organizationId, workerId, durationMinutes, qualityScore, taskId) {
      const entry = entryFor(workerId);
      entry.totalCompleted += 1;
      entry.totalDurationMinutes += durationMinutes;
      if (qualityScore) entry.qualityScores.push(Number.parseFloat(qualityScore) || 0);
      if (taskId) entry.recentTaskIds = [taskId, ...entry.recentTaskIds].slice(0, 10);

      await upsertDailySnapshot(organizationId, workerId, entry);
      const score = computeScore(workerId, entry);
      eventBus?.publish('performance.updated', {
        workerId,
        overallScore: score.overallScore,
        tasksCompleted: entry.totalCompleted,
        tasksFailed: entry.totalFailed,
      });
      return score;
    },

    async recordFailure(organizationId, workerId, durationMinutes, taskId) {
      const entry = entryFor(workerId);
      entry.totalFailed += 1;
      entry.totalDurationMinutes += durationMinutes;
      if (taskId) entry.recentTaskIds = [taskId, ...entry.recentTaskIds].slice(0, 10);

      await upsertDailySnapshot(organizationId, workerId, entry);
      const score = computeScore(workerId, entry);
      eventBus?.publish('performance.updated', {
        workerId,
        overallScore: score.overallScore,
        tasksCompleted: entry.totalCompleted,
        tasksFailed: entry.totalFailed,
      });
      return score;
    },

    getStatistics(_organizationId, workerId) {
      const entry = entryFor(workerId);
      const missionCount = entry.totalCompleted + entry.totalFailed;
      return {
        workerId,
        totalAssigned: missionCount + entry.totalCancelled,
        totalCompleted: entry.totalCompleted,
        totalFailed: entry.totalFailed,
        totalCancelled: entry.totalCancelled,
        averageDurationMinutes: toDecimalString(missionCount > 0 ? entry.totalDurationMinutes / missionCount : 0),
        recentTaskIds: entry.recentTaskIds,
        calculatedAt: now(),
      };
    },

    getScore(_organizationId, workerId) {
      return computeScore(workerId, entryFor(workerId));
    },
  };
}
