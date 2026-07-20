/** @module evaluation/repository */
import type { DecisionId, OrganizationId, EvaluationResultId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { EvaluationResult } from './types.js';

export interface EvaluationResultRepository extends Repository<
  EvaluationResult,
  EvaluationResultId
> {
  findByDecision(
    organizationId: OrganizationId,
    decisionId: DecisionId,
  ): Promise<readonly EvaluationResult[]>;
}
