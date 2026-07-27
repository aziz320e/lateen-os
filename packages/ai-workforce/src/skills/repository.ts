/** @module skills/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { SkillDefinition, SkillId } from './types.js';

export interface SkillDefinitionRepository extends Repository<SkillDefinition, SkillId> {
  findAll(organizationId: OrganizationId): Promise<readonly SkillDefinition[]>;
}
