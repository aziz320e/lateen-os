/** @module gap-analysis/repository */
import type { Repository } from '../shared/repository.js';
import type { ComplianceFrameworkId, GapAnalysisId, OrganizationId } from '../shared/identifiers.js';
import type { GapAnalysisResult } from './types.js';

export interface GapAnalysisRepository extends Repository<GapAnalysisResult, GapAnalysisId> {
  findAll(organizationId: OrganizationId): Promise<readonly GapAnalysisResult[]>;
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly GapAnalysisResult[]>;
}
