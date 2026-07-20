/** @module template/types */
import type { MemoryCategory } from '../classification/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, TemplateId } from '../shared/identifiers.js';
import type { MemoryTag } from '../shared/primitives.js';

export type { TemplateId };

export type TemplateStatus = 'draft' | 'active' | 'archived';

/** Variable placeholder in a reusable template. */
export interface TemplateVariable {
  readonly name: string;
  readonly description?: string;
  readonly required: boolean;
  readonly defaultValue?: string;
}

/** Reusable content template for institutional memory artifacts. */
export interface Template extends TenantAuditableEntity<TemplateId> {
  readonly title: string;
  readonly category: MemoryCategory;
  readonly content: string;
  readonly variables: readonly TemplateVariable[];
  readonly tags: readonly MemoryTag[];
  readonly status: TemplateStatus;
}

export type { OrganizationId };
