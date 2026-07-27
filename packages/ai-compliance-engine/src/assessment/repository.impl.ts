/** Real, in-memory {@link ComplianceAssessmentRepository} implementation. @module assessment/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ComplianceAssessmentRepository } from './repository.js';
import type { ComplianceAssessment } from './types.js';

/** Creates a real, in-memory {@link ComplianceAssessmentRepository}. */
export function createComplianceAssessmentRepository(seed?: readonly ComplianceAssessment[]): ComplianceAssessmentRepository {
  const repo = createInMemoryRepository<ComplianceAssessment>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByFrameworkId(organizationId, frameworkId) {
      return repo.list(organizationId).filter((assessment) => assessment.frameworkId === frameworkId);
    },
  };
}
