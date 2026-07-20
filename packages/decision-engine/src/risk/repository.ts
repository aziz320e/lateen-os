/** @module risk/repository */
import type { OrganizationId, RiskAssessmentId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { RiskAssessment, RiskLevel } from './types.js';

export interface RiskAssessmentRepository extends Repository<RiskAssessment, RiskAssessmentId> {
  findByLevel(
    organizationId: OrganizationId,
    level: RiskLevel,
  ): Promise<readonly RiskAssessment[]>;
}
