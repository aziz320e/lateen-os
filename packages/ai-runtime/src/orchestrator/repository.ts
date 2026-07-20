/** @module orchestrator/repository */
import type { OrchestrationId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { MultiAgentWorkflow } from './types.js';

export interface MultiAgentWorkflowRepository
  extends Repository<MultiAgentWorkflow, OrchestrationId> {}
