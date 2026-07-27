import { describe, expect, it, vi } from 'vitest';
import { createPerformanceMetricsRepository } from '../src/performance/repository.impl.js';
import { createPerformanceEngine } from '../src/performance/performance-engine.impl.js';
import { createWorkforceEventBus } from '../src/events/workforce-event-bus.js';

const ORG = 'org-1';
const WORKER = 'worker-1';

describe('createPerformanceEngine', () => {
  it('getStatistics()/getScore() start at zero for an unknown worker', () => {
    const engine = createPerformanceEngine(createPerformanceMetricsRepository());
    const stats = engine.getStatistics(ORG, WORKER);
    expect(stats.totalCompleted).toBe(0);
    expect(stats.totalFailed).toBe(0);

    const score = engine.getScore(ORG, WORKER);
    expect(score.productivityScore).toBe('0.00');
  });

  it('recordSuccess() increases tasksCompleted and success rate', async () => {
    const engine = createPerformanceEngine(createPerformanceMetricsRepository());
    await engine.recordSuccess(ORG, WORKER, 30, '0.90', 'task-1');
    await engine.recordSuccess(ORG, WORKER, 60, '0.80', 'task-2');

    const stats = engine.getStatistics(ORG, WORKER);
    expect(stats.totalCompleted).toBe(2);
    expect(stats.totalFailed).toBe(0);
    expect(stats.recentTaskIds).toEqual(['task-2', 'task-1']);
    expect(Number(stats.averageDurationMinutes)).toBeCloseTo(45, 5);

    const score = engine.getScore(ORG, WORKER);
    expect(score.productivityScore).toBe('1.00');
    expect(Number(score.qualityScore)).toBeCloseTo(0.85, 5);
  });

  it('recordFailure() decreases success rate and increases failure rate', async () => {
    const engine = createPerformanceEngine(createPerformanceMetricsRepository());
    await engine.recordSuccess(ORG, WORKER, 30);
    await engine.recordFailure(ORG, WORKER, 30);

    const stats = engine.getStatistics(ORG, WORKER);
    expect(stats.totalCompleted).toBe(1);
    expect(stats.totalFailed).toBe(1);

    const score = engine.getScore(ORG, WORKER);
    expect(score.productivityScore).toBe('0.50');
    expect(score.collaborationScore).toBe('0.50');
  });

  it('falls back to the success rate as the quality score when no quality was ever reported', async () => {
    const engine = createPerformanceEngine(createPerformanceMetricsRepository());
    await engine.recordSuccess(ORG, WORKER, 10);
    await engine.recordFailure(ORG, WORKER, 10);
    const score = engine.getScore(ORG, WORKER);
    expect(score.qualityScore).toBe('0.50');
  });

  it('persists a daily PerformanceMetrics snapshot and upserts on the same day', async () => {
    const repository = createPerformanceMetricsRepository();
    const engine = createPerformanceEngine(repository);
    await engine.recordSuccess(ORG, WORKER, 30);
    await engine.recordSuccess(ORG, WORKER, 30);

    const metrics = await repository.findByWorker(ORG, WORKER);
    expect(metrics).toHaveLength(1);
    expect(metrics[0]?.tasksCompleted).toBe(2);
  });

  it('publishes performance.updated on every record', async () => {
    const eventBus = createWorkforceEventBus();
    const handler = vi.fn();
    eventBus.subscribe('performance.updated', handler);
    const engine = createPerformanceEngine(createPerformanceMetricsRepository(), eventBus);

    await engine.recordSuccess(ORG, WORKER, 15);
    await engine.recordFailure(ORG, WORKER, 15);
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('keeps ledgers independent per worker instance (no hidden global state)', async () => {
    const engineA = createPerformanceEngine(createPerformanceMetricsRepository());
    const engineB = createPerformanceEngine(createPerformanceMetricsRepository());
    await engineA.recordSuccess(ORG, WORKER, 10);
    expect(engineB.getStatistics(ORG, WORKER).totalCompleted).toBe(0);
  });
});
