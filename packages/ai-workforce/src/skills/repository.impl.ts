/** Real in-memory {@link SkillDefinitionRepository} implementation. @module skills/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { SkillDefinition } from './types.js';
import type { SkillDefinitionRepository } from './repository.js';

/** Creates a real, in-memory {@link SkillDefinitionRepository}. */
export function createSkillDefinitionRepository(seed?: readonly SkillDefinition[]): SkillDefinitionRepository {
  const repo = createInMemoryRepository<SkillDefinition>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
