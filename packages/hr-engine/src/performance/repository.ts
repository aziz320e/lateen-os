/** @module performance/repository */
import type { EmployeeId } from '../employee/types.js';
import type { Repository } from '../shared/repository.js';
import type { EvaluationId, ObjectiveId, OrganizationId, ReviewPeriodId } from '../shared/identifiers.js';
import type { Evaluation, Objective, ReviewPeriod } from './types.js';

export interface ReviewPeriodRepository extends Repository<ReviewPeriod, ReviewPeriodId> {
  findAll(organizationId: OrganizationId): Promise<readonly ReviewPeriod[]>;
}

export interface ObjectiveRepository extends Repository<Objective, ObjectiveId> {
  findAll(organizationId: OrganizationId): Promise<readonly Objective[]>;
  findByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly Objective[]>;
  findByReviewPeriod(organizationId: OrganizationId, reviewPeriodId: ReviewPeriodId): Promise<readonly Objective[]>;
}

export interface EvaluationRepository extends Repository<Evaluation, EvaluationId> {
  findAll(organizationId: OrganizationId): Promise<readonly Evaluation[]>;
  findByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly Evaluation[]>;
}
