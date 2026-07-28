/** @module budget/repository */
import type { ProjectId } from '../project/types.js';
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, ProjectBudgetId } from '../shared/identifiers.js';
import type { ProjectBudget } from './types.js';

export interface ProjectBudgetRepository extends Repository<ProjectBudget, ProjectBudgetId> {
  findAll(organizationId: OrganizationId): Promise<readonly ProjectBudget[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly ProjectBudget[]>;
}
