/** @module templates/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  WorkflowDefinitionId,
  WorkflowStepId,
  WorkflowTemplateId,
  WorkflowVersionId,
} from '../shared/identifiers.js';
import type { WorkflowCategory, WorkflowMetadata } from '../workflow/types.js';

export type { WorkflowTemplateId };

/** Reusable workflow blueprint for common business processes. */
export interface WorkflowTemplate extends TenantAuditableEntity<WorkflowTemplateId> {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly category: WorkflowCategory;
  readonly metadata: WorkflowMetadata;
  readonly stepBlueprint: readonly WorkflowStepBlueprint[];
  readonly sourceDefinitionId?: WorkflowDefinitionId;
  readonly sourceVersionId?: WorkflowVersionId;
}

/** Step blueprint within a template. */
export interface WorkflowStepBlueprint {
  readonly code: string;
  readonly name: string;
  readonly type: 'human' | 'ai' | 'service' | 'decision' | 'gateway';
  readonly optional: boolean;
  readonly nextStepCodes: readonly string[];
}

export type { OrganizationId, WorkflowDefinitionId, WorkflowStepId };
