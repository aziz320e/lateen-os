/** @module workflow/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  WorkflowDefinitionId,
  WorkflowStepId,
  WorkflowVersionId,
} from '../shared/identifiers.js';
import type { SemanticVersion, Timestamp } from '../shared/primitives.js';

export type { WorkflowDefinitionId, WorkflowVersionId };

export type WorkflowCategory =
  | 'operational'
  | 'approval'
  | 'discovery'
  | 'onboarding'
  | 'governance'
  | 'integration'
  | 'custom';

export type WorkflowDefinitionStatus = 'draft' | 'published' | 'deprecated' | 'archived';

/** Descriptive metadata for a workflow definition. */
export interface WorkflowMetadata {
  readonly category: WorkflowCategory;
  readonly tags?: readonly string[];
  readonly ownerEmployeeId?: string;
  readonly documentationUrl?: string;
  readonly estimatedDurationMinutes?: number;
}

/** Immutable version of a workflow definition. */
export interface WorkflowVersion extends TenantAuditableEntity<WorkflowVersionId> {
  readonly definitionId: WorkflowDefinitionId;
  readonly version: SemanticVersion;
  readonly status: WorkflowDefinitionStatus;
  readonly stepIds: readonly WorkflowStepId[];
  readonly publishedAt?: Timestamp;
  readonly changeNotes?: string;
}

/**
 * Workflow definition — canonical blueprint for orchestrating
 * humans, AI workers, services, and business processes.
 */
export interface WorkflowDefinition extends TenantAuditableEntity<WorkflowDefinitionId> {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly metadata: WorkflowMetadata;
  readonly currentVersionId: WorkflowVersionId;
  readonly status: WorkflowDefinitionStatus;
}

export type { OrganizationId, WorkflowStepId };
