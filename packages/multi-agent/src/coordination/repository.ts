/** @module coordination/repository */
import type { Repository } from '../shared/repository.js';
import type {
  Coordinator,
  CoordinatorId,
  CoordinationPlan,
  CoordinationPlanId,
  CoordinationStep,
  CoordinationStepId,
} from './types.js';

export type CoordinatorRepository = Repository<Coordinator, CoordinatorId>;
export type CoordinationPlanRepository = Repository<CoordinationPlan, CoordinationPlanId>;
export type CoordinationStepRepository = Repository<CoordinationStep, CoordinationStepId>;
