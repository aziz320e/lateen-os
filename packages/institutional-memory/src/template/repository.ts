/** @module template/repository */
import type { MemoryCategory } from '../classification/types.js';
import type { OrganizationId, TemplateId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Template, TemplateStatus } from './types.js';

export interface TemplateRepository extends Repository<Template, TemplateId> {
  findByCategory(
    organizationId: OrganizationId,
    category: MemoryCategory,
  ): Promise<readonly Template[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: TemplateStatus,
  ): Promise<readonly Template[]>;
}
