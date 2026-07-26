/** Real in-memory {@link TriggerDefinitionRepository} implementation. @module trigger/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { TriggerDefinition } from './types.js';
import type { TriggerDefinitionRepository } from './repository.js';

export function createTriggerDefinitionRepository(seed?: readonly TriggerDefinition[]): TriggerDefinitionRepository {
  return createInMemoryRepository<TriggerDefinition>({ seed });
}
