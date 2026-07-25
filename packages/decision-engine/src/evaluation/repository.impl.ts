/** Real in-memory {@link EvaluationResultRepository} implementation. @module evaluation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { EvaluationResultId } from '../shared/identifiers.js';
import type { EvaluationResult } from './types.js';
import type { EvaluationResultRepository } from './repository.js';

export function createEvaluationResultRepository(seed?: readonly EvaluationResult[]): EvaluationResultRepository {
  const repo = createInMemoryRepository<EvaluationResult, EvaluationResultId>({ seed });
  return {
    ...repo,
    async findByDecision(organizationId, decisionId) {
      return repo.list(organizationId).filter((result) => result.decisionId === decisionId);
    },
  };
}
