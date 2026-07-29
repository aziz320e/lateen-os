/** @module extension-registry/repository */
import type { Repository } from '../shared/repository.js';
import type { ExtensionId, OrganizationId } from '../shared/identifiers.js';
import type { Extension } from './types.js';

export interface ExtensionRepository extends Repository<Extension, ExtensionId> {
  findAll(organizationId: OrganizationId): Promise<readonly Extension[]>;
  findByKey(organizationId: OrganizationId, key: string): Promise<Extension | null>;
}
