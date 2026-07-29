/** Real, in-memory Validation Schema repository. @module validation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ValidationSchemaRepository } from './repository.js';
import type { ValidationSchema } from './types.js';

/** Creates a real, in-memory {@link ValidationSchemaRepository}. */
export function createValidationSchemaRepository(seed?: readonly ValidationSchema[]): ValidationSchemaRepository {
  const repo = createInMemoryRepository<ValidationSchema>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
