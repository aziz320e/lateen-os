/** Real, in-memory {@link ControlMappingRepository} implementation. @module control-mapping/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ControlMappingRepository } from './repository.js';
import type { ControlMapping } from './types.js';

/** Creates a real, in-memory {@link ControlMappingRepository}. */
export function createControlMappingRepository(seed?: readonly ControlMapping[]): ControlMappingRepository {
  const repo = createInMemoryRepository<ControlMapping>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByControlId(organizationId, controlId) {
      return repo.list(organizationId).filter((mapping) => mapping.controlId === controlId);
    },
    async findByMappedRecord(organizationId, mappedType, mappedId) {
      return repo.list(organizationId).filter((mapping) => mapping.mappedType === mappedType && mapping.mappedId === mappedId);
    },
  };
}
