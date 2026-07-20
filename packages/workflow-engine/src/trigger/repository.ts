/** @module trigger/repository */
import type { Repository } from '../shared/repository.js';
import type { TriggerDefinition, TriggerId } from './types.js';

export type TriggerDefinitionRepository = Repository<TriggerDefinition, TriggerId>;
