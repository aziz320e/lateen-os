/** @module folder/repository */
import type { Repository } from '../shared/repository.js';
import type { FolderId, OrganizationId } from '../shared/identifiers.js';
import type { Folder } from './types.js';

export interface FolderRepository extends Repository<Folder, FolderId> {
  findAll(organizationId: OrganizationId): Promise<readonly Folder[]>;
  findByParent(organizationId: OrganizationId, parentFolderId: FolderId): Promise<readonly Folder[]>;
}
