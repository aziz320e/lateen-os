/** @module skills/repository */
import type { Repository } from '../shared/repository.js';
import type { SkillDefinition, SkillId } from './types.js';

export type SkillDefinitionRepository = Repository<SkillDefinition, SkillId>;
