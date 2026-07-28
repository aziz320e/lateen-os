/** Real, in-memory Position Management repository. @module position/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PositionRepository } from './repository.js';
import type { Position } from './types.js';

/** Creates a real, in-memory {@link PositionRepository}. */
export function createPositionRepository(seed?: readonly Position[]): PositionRepository {
  const repo = createInMemoryRepository<Position>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByDepartment(organizationId, departmentId) {
      return repo.list(organizationId).filter((position) => position.departmentId === departmentId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((position) => position.status === status);
    },
  };
}
