import { describe, expect, it } from 'vitest';
import { createHrEventBus } from '../src/events/index.js';
import {
  computeOverallRating,
  computePromotionRecommendation,
  createPerformanceManagementEngine,
  PROMOTION_RATING_THRESHOLD,
} from '../src/performance/engine.impl.js';
import { createEvaluationRepository, createObjectiveRepository, createReviewPeriodRepository } from '../src/performance/repository.impl.js';
import { EvaluationNotFoundError, ObjectiveNotFoundError, ReviewPeriodNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const EMPLOYEE = 'employee-1';

function setup(eventBus = createHrEventBus()) {
  const reviewPeriodRepository = createReviewPeriodRepository();
  const objectiveRepository = createObjectiveRepository();
  const evaluationRepository = createEvaluationRepository();
  const engine = createPerformanceManagementEngine(reviewPeriodRepository, objectiveRepository, evaluationRepository, eventBus);
  return { reviewPeriodRepository, objectiveRepository, evaluationRepository, engine, eventBus };
}

describe('computeOverallRating (pure)', () => {
  it('computes a weighted average across objectives', () => {
    const objectives = [
      { id: 'o1', weightPct: '60' } as never,
      { id: 'o2', weightPct: '40' } as never,
    ];
    const rating = computeOverallRating(
      [
        { objectiveId: 'o1', rating: 5 },
        { objectiveId: 'o2', rating: 3 },
      ],
      objectives,
    );
    expect(rating).toBe(4.2);
  });

  it('is 0 when there are no ratings', () => {
    expect(computeOverallRating([], [])).toBe(0);
  });

  it('ignores a rating for an objective with no matching weight', () => {
    const rating = computeOverallRating([{ objectiveId: 'unknown', rating: 5 }], []);
    expect(rating).toBe(0);
  });
});

describe('computePromotionRecommendation (pure)', () => {
  it('recommends promotion at or above the threshold', () => {
    expect(computePromotionRecommendation(PROMOTION_RATING_THRESHOLD)).toBe(true);
    expect(computePromotionRecommendation(5)).toBe(true);
  });

  it('does not recommend promotion below the threshold', () => {
    expect(computePromotionRecommendation(3.9)).toBe(false);
  });

  it('supports a custom threshold', () => {
    expect(computePromotionRecommendation(3, 3)).toBe(true);
  });
});

describe('PerformanceManagementEngine — review periods', () => {
  it('createReviewPeriod() starts open', async () => {
    const { engine } = setup();
    const period = await engine.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    expect(period.status).toBe('open');
  });

  it('closeReviewPeriod() moves to closed', async () => {
    const { engine } = setup();
    const period = await engine.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    const closed = await engine.closeReviewPeriod(ORG, period.id);
    expect(closed.status).toBe('closed');
  });

  it('throws ReviewPeriodNotFoundError for an unknown period', async () => {
    const { engine } = setup();
    await expect(engine.closeReviewPeriod(ORG, 'missing')).rejects.toBeInstanceOf(ReviewPeriodNotFoundError);
  });

  it('getReviewPeriod()/listReviewPeriods() round-trip', async () => {
    const { engine } = setup();
    const period = await engine.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    expect(await engine.getReviewPeriod(ORG, period.id)).toEqual(period);
    expect(await engine.listReviewPeriods(ORG)).toHaveLength(1);
  });
});

describe('PerformanceManagementEngine — objectives', () => {
  it('createObjective() starts in_progress', async () => {
    const { engine } = setup();
    const period = await engine.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    const objective = await engine.createObjective(ORG, { employeeId: EMPLOYEE, reviewPeriodId: period.id, description: 'Ship feature X', weightPct: '50' });
    expect(objective.status).toBe('in_progress');
  });

  it('createObjective() throws ReviewPeriodNotFoundError for an unknown period', async () => {
    const { engine } = setup();
    await expect(
      engine.createObjective(ORG, { employeeId: EMPLOYEE, reviewPeriodId: 'missing', description: 'x', weightPct: '50' }),
    ).rejects.toBeInstanceOf(ReviewPeriodNotFoundError);
  });

  it('updateObjectiveStatus() transitions status', async () => {
    const { engine } = setup();
    const period = await engine.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    const objective = await engine.createObjective(ORG, { employeeId: EMPLOYEE, reviewPeriodId: period.id, description: 'x', weightPct: '50' });
    const updated = await engine.updateObjectiveStatus(ORG, objective.id, 'completed');
    expect(updated.status).toBe('completed');
  });

  it('throws ObjectiveNotFoundError for an unknown objective', async () => {
    const { engine } = setup();
    await expect(engine.updateObjectiveStatus(ORG, 'missing', 'completed')).rejects.toBeInstanceOf(ObjectiveNotFoundError);
  });

  it('findObjectivesByEmployee()/findObjectivesByReviewPeriod() round-trip', async () => {
    const { engine } = setup();
    const period = await engine.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    await engine.createObjective(ORG, { employeeId: EMPLOYEE, reviewPeriodId: period.id, description: 'x', weightPct: '50' });
    expect(await engine.findObjectivesByEmployee(ORG, EMPLOYEE)).toHaveLength(1);
    expect(await engine.findObjectivesByReviewPeriod(ORG, period.id)).toHaveLength(1);
  });
});

describe('PerformanceManagementEngine — objective statuses', () => {
  it('supports all three objective statuses', async () => {
    const { engine } = setup();
    const period = await engine.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    const objective = await engine.createObjective(ORG, { employeeId: EMPLOYEE, reviewPeriodId: period.id, description: 'x', weightPct: '50' });
    const statuses = ['in_progress', 'completed', 'missed'] as const;
    for (const status of statuses) {
      const updated = await engine.updateObjectiveStatus(ORG, objective.id, status);
      expect(updated.status).toBe(status);
    }
  });
});

describe('PerformanceManagementEngine — findObjectivesByReviewPeriod across employees', () => {
  it('returns objectives for every employee within the period', async () => {
    const { engine } = setup();
    const period = await engine.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    await engine.createObjective(ORG, { employeeId: 'employee-1', reviewPeriodId: period.id, description: 'x', weightPct: '50' });
    await engine.createObjective(ORG, { employeeId: 'employee-2', reviewPeriodId: period.id, description: 'y', weightPct: '50' });
    expect(await engine.findObjectivesByReviewPeriod(ORG, period.id)).toHaveLength(2);
  });
});

describe('PerformanceManagementEngine — evaluations', () => {
  it('createEvaluation() computes overallRating and promotionRecommended deterministically', async () => {
    const { engine } = setup();
    const period = await engine.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    const objective = await engine.createObjective(ORG, { employeeId: EMPLOYEE, reviewPeriodId: period.id, description: 'x', weightPct: '100' });
    const evaluation = await engine.createEvaluation(ORG, {
      employeeId: EMPLOYEE,
      reviewPeriodId: period.id,
      objectiveRatings: [{ objectiveId: objective.id, rating: 5 }],
    });
    expect(evaluation.overallRating).toBe(5);
    expect(evaluation.promotionRecommended).toBe(true);
    expect(evaluation.status).toBe('draft');
  });

  it('completeEvaluation() moves draft -> completed and publishes performance.completed', async () => {
    const eventBus = createHrEventBus();
    const { engine } = setup(eventBus);
    const period = await engine.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    const objective = await engine.createObjective(ORG, { employeeId: EMPLOYEE, reviewPeriodId: period.id, description: 'x', weightPct: '100' });
    const evaluation = await engine.createEvaluation(ORG, {
      employeeId: EMPLOYEE,
      reviewPeriodId: period.id,
      objectiveRatings: [{ objectiveId: objective.id, rating: 2 }],
    });
    let seen: unknown;
    eventBus.subscribe('performance.completed', (payload) => (seen = payload));
    const completed = await engine.completeEvaluation(ORG, evaluation.id);
    expect(completed.status).toBe('completed');
    expect(completed.promotionRecommended).toBe(false);
    expect(seen).toEqual({ organizationId: ORG, evaluationId: evaluation.id, employeeId: EMPLOYEE, overallRating: 2 });
  });

  it('throws EvaluationNotFoundError for an unknown evaluation', async () => {
    const { engine } = setup();
    await expect(engine.completeEvaluation(ORG, 'missing')).rejects.toBeInstanceOf(EvaluationNotFoundError);
  });

  it('createEvaluation() with multiple objectives computes a correctly weighted average', async () => {
    const { engine } = setup();
    const period = await engine.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    const objectiveA = await engine.createObjective(ORG, { employeeId: EMPLOYEE, reviewPeriodId: period.id, description: 'A', weightPct: '25' });
    const objectiveB = await engine.createObjective(ORG, { employeeId: EMPLOYEE, reviewPeriodId: period.id, description: 'B', weightPct: '75' });
    const evaluation = await engine.createEvaluation(ORG, {
      employeeId: EMPLOYEE,
      reviewPeriodId: period.id,
      objectiveRatings: [
        { objectiveId: objectiveA.id, rating: 1 },
        { objectiveId: objectiveB.id, rating: 5 },
      ],
    });
    expect(evaluation.overallRating).toBe(4);
  });

  it('getEvaluation()/findEvaluationsByEmployee() round-trip', async () => {
    const { engine } = setup();
    const period = await engine.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    const evaluation = await engine.createEvaluation(ORG, { employeeId: EMPLOYEE, reviewPeriodId: period.id, objectiveRatings: [] });
    expect(await engine.getEvaluation(ORG, evaluation.id)).toEqual(evaluation);
    expect(await engine.findEvaluationsByEmployee(ORG, EMPLOYEE)).toHaveLength(1);
  });
});
