/** @module plugin-registry/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, PluginId } from '../shared/identifiers.js';
import type { Plugin } from './types.js';

export interface PluginRepository extends Repository<Plugin, PluginId> {
  findAll(organizationId: OrganizationId): Promise<readonly Plugin[]>;
  findByKey(organizationId: OrganizationId, key: string): Promise<Plugin | null>;
}
