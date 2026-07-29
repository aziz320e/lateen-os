/** @module configuration/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, RuntimeConfigId } from '../shared/identifiers.js';
import type { RuntimeConfigEntry } from './types.js';

export interface RuntimeConfigRepository extends Repository<RuntimeConfigEntry, RuntimeConfigId> {
  findAll(organizationId: OrganizationId): Promise<readonly RuntimeConfigEntry[]>;
}
