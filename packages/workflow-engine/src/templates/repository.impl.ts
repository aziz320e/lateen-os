/** Real in-memory {@link WorkflowTemplateRepository} implementation. @module templates/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { WorkflowTemplate } from './types.js';
import type { WorkflowTemplateRepository } from './repository.js';

export function createWorkflowTemplateRepository(seed?: readonly WorkflowTemplate[]): WorkflowTemplateRepository {
  return createInMemoryRepository<WorkflowTemplate>({ seed });
}
