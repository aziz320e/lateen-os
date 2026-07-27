/** @module assessment/repository */
import type { Repository } from '../shared/repository.js';
import type { ComplianceAssessmentId, ComplianceFrameworkId, OrganizationId } from '../shared/identifiers.js';
import type { ComplianceAssessment } from './types.js';

export interface ComplianceAssessmentRepository extends Repository<ComplianceAssessment, ComplianceAssessmentId> {
  findAll(organizationId: OrganizationId): Promise<readonly ComplianceAssessment[]>;
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly ComplianceAssessment[]>;
}
