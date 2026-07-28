/** Real, in-memory Folders repository. @module folder/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { FolderRepository } from './repository.js';
import type { Folder } from './types.js';

/** Creates a real, in-memory {@link FolderRepository}. */
export function createFolderRepository(seed?: readonly Folder[]): FolderRepository {
  const repo = createInMemoryRepository<Folder>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByParent(organizationId, parentFolderId) {
      return repo.list(organizationId).filter((folder) => folder.parentFolderId === parentFolderId);
    },
  };
}
