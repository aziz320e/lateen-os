/** @module template/repository */
import type { OrganizationId, TemplateId, TemplateVersionId } from '../shared/identifiers.js';
import type { Template, TemplateStatus, TemplateType, TemplateVersion } from './types.js';

export interface TemplateRepository {
  save(template: Template): Promise<void>;
  findById(organizationId: OrganizationId, templateId: TemplateId): Promise<Template | null>;
  delete(organizationId: OrganizationId, templateId: TemplateId): Promise<void>;
  findAll(organizationId: OrganizationId): Promise<readonly Template[]>;
  findByType(organizationId: OrganizationId, templateType: TemplateType): Promise<readonly Template[]>;
  findByStatus(organizationId: OrganizationId, status: TemplateStatus): Promise<readonly Template[]>;
}

export interface TemplateVersionRepository {
  save(version: TemplateVersion): Promise<void>;
  findById(organizationId: OrganizationId, versionId: TemplateVersionId): Promise<TemplateVersion | null>;
  /** Every version for a template, ordered oldest first. */
  findAllByTemplate(organizationId: OrganizationId, templateId: TemplateId): Promise<readonly TemplateVersion[]>;
}
