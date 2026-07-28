/** @module risk/repository */
import type { ProjectId } from '../project/types.js';
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, ProjectRiskId } from '../shared/identifiers.js';
import type { ProjectRisk, RiskStatus } from './types.js';

export interface ProjectRiskRepository extends Repository<ProjectRisk, ProjectRiskId> {
  findAll(organizationId: OrganizationId): Promise<readonly ProjectRisk[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly ProjectRisk[]>;
  findByStatus(organizationId: OrganizationId, status: RiskStatus): Promise<readonly ProjectRisk[]>;
}
