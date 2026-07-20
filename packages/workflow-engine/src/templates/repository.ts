/** @module templates/repository */
import type { Repository } from '../shared/repository.js';
import type { WorkflowTemplate, WorkflowTemplateId } from './types.js';

export type WorkflowTemplateRepository = Repository<WorkflowTemplate, WorkflowTemplateId>;
