/** @module workflow/repository */
import type { Repository } from '../shared/repository.js';
import type {
  WorkflowDefinition,
  WorkflowDefinitionId,
  WorkflowVersion,
  WorkflowVersionId,
} from './types.js';

export type WorkflowDefinitionRepository = Repository<WorkflowDefinition, WorkflowDefinitionId>;
export type WorkflowVersionRepository = Repository<WorkflowVersion, WorkflowVersionId>;
