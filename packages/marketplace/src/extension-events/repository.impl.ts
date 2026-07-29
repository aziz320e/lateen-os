/** Real, in-memory Event Declaration repository. @module extension-events/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { EventDeclarationRepository } from './repository.js';
import type { EventDeclaration } from './types.js';

/** Creates a real, in-memory {@link EventDeclarationRepository}. */
export function createEventDeclarationRepository(seed?: readonly EventDeclaration[]): EventDeclarationRepository {
  const repo = createInMemoryRepository<EventDeclaration>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByExtension(organizationId, extensionId) {
      return repo.list(organizationId).filter((declaration) => declaration.extensionId === extensionId);
    },
  };
}
