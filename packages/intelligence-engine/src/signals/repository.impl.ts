/** Real in-memory {@link SignalRepository} implementation. @module signals/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { SignalId } from '../shared/identifiers.js';
import type { Signal } from './types.js';
import type { SignalRepository } from './repository.js';

export function createSignalRepository(seed?: readonly Signal[]): SignalRepository {
  const repo = createInMemoryRepository<Signal, SignalId>({ seed });
  return {
    ...repo,
    async findByType(organizationId, type) {
      return repo.list(organizationId).filter((signal) => signal.type === type);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((signal) => signal.status === status);
    },
  };
}
