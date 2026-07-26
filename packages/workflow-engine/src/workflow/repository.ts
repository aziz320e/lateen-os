/** @module workflow/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type {
  WorkflowDefinition,
  WorkflowDefinitionId,
  WorkflowVersion,
  WorkflowVersionId,
} from './types.js';

export interface WorkflowDefinitionRepository extends Repository<WorkflowDefinition, WorkflowDefinitionId> {
  findByCode(organizationId: OrganizationId, code: string): Promise<WorkflowDefinition | null>;
}
export type WorkflowVersionRepository = Repository<WorkflowVersion, WorkflowVersionId>;
