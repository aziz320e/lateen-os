/** Real in-memory {@link RiskAssessmentRepository} implementation. @module risk/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { RiskAssessmentId } from '../shared/identifiers.js';
import type { RiskAssessment } from './types.js';
import type { RiskAssessmentRepository } from './repository.js';

export function createRiskAssessmentRepository(seed?: readonly RiskAssessment[]): RiskAssessmentRepository {
  const repo = createInMemoryRepository<RiskAssessment, RiskAssessmentId>({ seed });
  return {
    ...repo,
    async findByLevel(organizationId, level) {
      return repo.list(organizationId).filter((assessment) => assessment.overallLevel === level);
    },
  };
}
