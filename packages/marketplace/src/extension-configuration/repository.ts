/** @module extension-configuration/repository */
import type { Repository } from '../shared/repository.js';
import type { ExtensionConfigId, ExtensionId, OrganizationId } from '../shared/identifiers.js';
import type { ExtensionConfigEntry } from './types.js';

export interface ExtensionConfigRepository extends Repository<ExtensionConfigEntry, ExtensionConfigId> {
  findAll(organizationId: OrganizationId): Promise<readonly ExtensionConfigEntry[]>;
  findByExtension(organizationId: OrganizationId, extensionId: ExtensionId): Promise<readonly ExtensionConfigEntry[]>;
}
