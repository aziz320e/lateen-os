/** @module playbook/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { KpiId, OrganizationId, PlaybookId, PlaybookStepId } from '../shared/identifiers.js';
import type { MemoryTag } from '../shared/primitives.js';

export type { PlaybookId };

export type PlaybookStatus = 'draft' | 'active' | 'deprecated' | 'archived';

/** A single step in an operational playbook. */
export interface PlaybookStep {
  readonly stepId: PlaybookStepId;
  readonly order: number;
  readonly title: string;
  readonly description: string;
}

/** Repeatable operational procedure with expected outcomes and KPIs. */
export interface Playbook extends TenantAuditableEntity<PlaybookId> {
  readonly title: string;
  readonly purpose: string;
  readonly steps: readonly PlaybookStep[];
  readonly expectedOutcome: string;
  readonly kpiIds?: readonly KpiId[];
  readonly tags: readonly MemoryTag[];
  readonly status: PlaybookStatus;
}

export type { OrganizationId };
