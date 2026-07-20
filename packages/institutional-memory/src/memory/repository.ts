/** @module memory/repository */
import type { MemoryCategory, ImportanceLevel } from '../classification/types.js';
import type { OrganizationId, InstitutionalMemoryId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { MemoryTag } from '../shared/primitives.js';
import type { InstitutionalMemory, InstitutionalMemoryStatus } from './types.js';

export interface InstitutionalMemoryRepository extends Repository<
  InstitutionalMemory,
  InstitutionalMemoryId
> {
  findByCategory(
    organizationId: OrganizationId,
    category: MemoryCategory,
  ): Promise<readonly InstitutionalMemory[]>;
  findByImportance(
    organizationId: OrganizationId,
    importance: ImportanceLevel,
  ): Promise<readonly InstitutionalMemory[]>;
  findByTag(organizationId: OrganizationId, tag: MemoryTag): Promise<readonly InstitutionalMemory[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: InstitutionalMemoryStatus,
  ): Promise<readonly InstitutionalMemory[]>;
}
