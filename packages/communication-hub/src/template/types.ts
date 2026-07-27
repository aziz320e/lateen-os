/** @module template/types */
import type { TemplateId, TemplateVersionId } from '../shared/identifiers.js';

export type { TemplateId, TemplateVersionId };

/** Deterministic template kind. */
export type TemplateType = 'email' | 'sms' | 'whatsapp' | 'notification';

export type TemplateStatus = 'draft' | 'active' | 'archived';

/** A named, versioned, variable-driven message template. */
export interface Template {
  readonly id: TemplateId;
  readonly organizationId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly templateType: TemplateType;
  readonly name: string;
  /** The raw body, containing `{{variable}}` placeholders. */
  readonly body: string;
  /** Every variable name this template declares. */
  readonly variables: readonly string[];
  readonly status: TemplateStatus;
  readonly currentVersion: number;
}

/** Immutable snapshot of a {@link Template} at a point in its version history. */
export interface TemplateVersion {
  readonly id: TemplateVersionId;
  readonly organizationId: string;
  readonly templateId: TemplateId;
  readonly versionNumber: number;
  readonly snapshot: Template;
  readonly createdAt: string;
}
