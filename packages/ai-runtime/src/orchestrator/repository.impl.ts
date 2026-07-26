/** Real in-memory {@link MultiAgentWorkflowRepository} implementation. @module orchestrator/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { OrchestrationId } from '../shared/identifiers.js';
import type { MultiAgentWorkflow } from './types.js';
import type { MultiAgentWorkflowRepository } from './repository.js';

export function createMultiAgentWorkflowRepository(seed?: readonly MultiAgentWorkflow[]): MultiAgentWorkflowRepository {
  return createInMemoryRepository<MultiAgentWorkflow, OrchestrationId>({ seed });
}
