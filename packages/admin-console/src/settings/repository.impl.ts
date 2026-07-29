/** Real, in-memory, platform-wide Setting repository. @module settings/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { SettingRepository } from './repository.js';
import type { Setting } from './types.js';

/** Every entity shares one constant partition key — scope/organization/tenant filtering happens above this repository, in the engine. */
const PARTITION_KEY = 'settings';

/** Creates a real, in-memory {@link SettingRepository}. */
export function createSettingRepository(seed?: readonly Setting[]): SettingRepository {
  const repo = createInMemoryRepository<Setting>({ seed, getOrganizationId: () => PARTITION_KEY });
  return {
    async findById(id) {
      return repo.findById(PARTITION_KEY, id);
    },
    async save(entity) {
      await repo.save(entity);
    },
    async findAll() {
      return repo.list(PARTITION_KEY);
    },
  };
}
