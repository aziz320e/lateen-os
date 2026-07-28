/**
 * Real Performance Management engine — review periods, weighted
 * objectives, and evaluations with a deterministic overall rating and
 * promotion recommendation. No AI — the overall rating is a fixed
 * weighted average, and the promotion recommendation is a fixed
 * threshold check.
 *
 * @module performance/engine.impl
 */
import type { EmployeeId } from '../employee/types.js';
import type { HrEventBus } from '../events/hr-event-bus.js';
import { parseDecimal } from '../shared/decimal.js';
import { EvaluationNotFoundError, ObjectiveNotFoundError, ReviewPeriodNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { EvaluationId, ObjectiveId, OrganizationId, ReviewPeriodId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { EvaluationRepository, ObjectiveRepository, ReviewPeriodRepository } from './repository.js';
import type { Evaluation, Objective, ObjectiveRating, ObjectiveStatus, ReviewPeriod } from './types.js';

/** Deterministic minimum overall rating (out of 5) at or above which a promotion is recommended. */
export const PROMOTION_RATING_THRESHOLD = 4;

/** Pure: weighted average rating across an evaluation's objective ratings, each weighted by its objective's `weightPct`. `0` when there are no ratings or the weights sum to `0`. */
export function computeOverallRating(objectiveRatings: readonly ObjectiveRating[], objectives: readonly Objective[]): number {
  const weightByObjectiveId = new Map(objectives.map((objective) => [objective.id, parseDecimal(objective.weightPct)] as const));
  const totalWeight = objectiveRatings.reduce((sum, rating) => sum + (weightByObjectiveId.get(rating.objectiveId) ?? 0), 0);
  if (totalWeight === 0) return 0;
  const weightedSum = objectiveRatings.reduce((sum, rating) => sum + rating.rating * (weightByObjectiveId.get(rating.objectiveId) ?? 0), 0);
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/** Pure: whether the overall rating meets the deterministic promotion threshold. */
export function computePromotionRecommendation(overallRating: number, threshold: number = PROMOTION_RATING_THRESHOLD): boolean {
  return overallRating >= threshold;
}

export interface CreateReviewPeriodInput {
  readonly name: string;
  readonly startDate: ISODate;
  readonly endDate: ISODate;
}

export interface CreateObjectiveInput {
  readonly employeeId: EmployeeId;
  readonly reviewPeriodId: ReviewPeriodId;
  readonly description: string;
  readonly weightPct: string;
}

export interface CreateEvaluationInput {
  readonly employeeId: EmployeeId;
  readonly reviewPeriodId: ReviewPeriodId;
  readonly objectiveRatings: readonly ObjectiveRating[];
}

export interface PerformanceManagementEngine {
  createReviewPeriod(organizationId: OrganizationId, input: CreateReviewPeriodInput): Promise<ReviewPeriod>;
  closeReviewPeriod(organizationId: OrganizationId, reviewPeriodId: ReviewPeriodId): Promise<ReviewPeriod>;
  getReviewPeriod(organizationId: OrganizationId, reviewPeriodId: ReviewPeriodId): Promise<ReviewPeriod | null>;
  listReviewPeriods(organizationId: OrganizationId): Promise<readonly ReviewPeriod[]>;

  createObjective(organizationId: OrganizationId, input: CreateObjectiveInput): Promise<Objective>;
  updateObjectiveStatus(organizationId: OrganizationId, objectiveId: ObjectiveId, status: ObjectiveStatus): Promise<Objective>;
  findObjectivesByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly Objective[]>;
  findObjectivesByReviewPeriod(organizationId: OrganizationId, reviewPeriodId: ReviewPeriodId): Promise<readonly Objective[]>;

  /** Computes the deterministic overall rating and promotion recommendation from the employee's objectives, and persists a `draft` evaluation. */
  createEvaluation(organizationId: OrganizationId, input: CreateEvaluationInput): Promise<Evaluation>;
  /** `draft` -> `completed`. Publishes `performance.completed`. */
  completeEvaluation(organizationId: OrganizationId, evaluationId: EvaluationId): Promise<Evaluation>;
  getEvaluation(organizationId: OrganizationId, evaluationId: EvaluationId): Promise<Evaluation | null>;
  findEvaluationsByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly Evaluation[]>;
}

/** Creates a real {@link PerformanceManagementEngine}. */
export function createPerformanceManagementEngine(
  reviewPeriodRepository: ReviewPeriodRepository,
  objectiveRepository: ObjectiveRepository,
  evaluationRepository: EvaluationRepository,
  eventBus?: HrEventBus,
  now: () => string = nowIso,
): PerformanceManagementEngine {
  async function requireReviewPeriod(organizationId: OrganizationId, reviewPeriodId: ReviewPeriodId): Promise<ReviewPeriod> {
    const period = await reviewPeriodRepository.findById(organizationId, reviewPeriodId);
    if (!period) throw new ReviewPeriodNotFoundError(reviewPeriodId);
    return period;
  }

  async function requireObjective(organizationId: OrganizationId, objectiveId: ObjectiveId): Promise<Objective> {
    const objective = await objectiveRepository.findById(organizationId, objectiveId);
    if (!objective) throw new ObjectiveNotFoundError(objectiveId);
    return objective;
  }

  async function requireEvaluation(organizationId: OrganizationId, evaluationId: EvaluationId): Promise<Evaluation> {
    const evaluation = await evaluationRepository.findById(organizationId, evaluationId);
    if (!evaluation) throw new EvaluationNotFoundError(evaluationId);
    return evaluation;
  }

  return {
    async createReviewPeriod(organizationId, input) {
      const timestamp = now();
      const period: ReviewPeriod = {
        id: generateId('review-period'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        status: 'open',
      };
      await reviewPeriodRepository.save(period);
      return period;
    },

    async closeReviewPeriod(organizationId, reviewPeriodId) {
      const period = await requireReviewPeriod(organizationId, reviewPeriodId);
      const updated: ReviewPeriod = { ...period, status: 'closed', updatedAt: now() };
      await reviewPeriodRepository.save(updated);
      return updated;
    },

    async getReviewPeriod(organizationId, reviewPeriodId) {
      return reviewPeriodRepository.findById(organizationId, reviewPeriodId);
    },

    async listReviewPeriods(organizationId) {
      return reviewPeriodRepository.findAll(organizationId);
    },

    async createObjective(organizationId, input) {
      await requireReviewPeriod(organizationId, input.reviewPeriodId);
      const timestamp = now();
      const objective: Objective = {
        id: generateId('objective'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        employeeId: input.employeeId,
        reviewPeriodId: input.reviewPeriodId,
        description: input.description,
        weightPct: input.weightPct,
        status: 'in_progress',
      };
      await objectiveRepository.save(objective);
      return objective;
    },

    async updateObjectiveStatus(organizationId, objectiveId, status) {
      const objective = await requireObjective(organizationId, objectiveId);
      const updated: Objective = { ...objective, status, updatedAt: now() };
      await objectiveRepository.save(updated);
      return updated;
    },

    async findObjectivesByEmployee(organizationId, employeeId) {
      return objectiveRepository.findByEmployee(organizationId, employeeId);
    },

    async findObjectivesByReviewPeriod(organizationId, reviewPeriodId) {
      return objectiveRepository.findByReviewPeriod(organizationId, reviewPeriodId);
    },

    async createEvaluation(organizationId, input) {
      const objectives = await objectiveRepository.findByEmployee(organizationId, input.employeeId);
      const overallRating = computeOverallRating(input.objectiveRatings, objectives);
      const timestamp = now();
      const evaluation: Evaluation = {
        id: generateId('evaluation'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        employeeId: input.employeeId,
        reviewPeriodId: input.reviewPeriodId,
        objectiveRatings: input.objectiveRatings,
        overallRating,
        promotionRecommended: computePromotionRecommendation(overallRating),
        status: 'draft',
      };
      await evaluationRepository.save(evaluation);
      return evaluation;
    },

    async completeEvaluation(organizationId, evaluationId) {
      const evaluation = await requireEvaluation(organizationId, evaluationId);
      const updated: Evaluation = { ...evaluation, status: 'completed', updatedAt: now() };
      await evaluationRepository.save(updated);
      eventBus?.publish('performance.completed', {
        organizationId,
        evaluationId,
        employeeId: evaluation.employeeId,
        overallRating: evaluation.overallRating,
      });
      return updated;
    },

    async getEvaluation(organizationId, evaluationId) {
      return evaluationRepository.findById(organizationId, evaluationId);
    },

    async findEvaluationsByEmployee(organizationId, employeeId) {
      return evaluationRepository.findByEmployee(organizationId, employeeId);
    },
  };
}
