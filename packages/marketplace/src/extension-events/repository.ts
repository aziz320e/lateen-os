/** @module extension-events/repository */
import type { Repository } from '../shared/repository.js';
import type { EventDeclarationId, ExtensionId, OrganizationId } from '../shared/identifiers.js';
import type { EventDeclaration } from './types.js';

export interface EventDeclarationRepository extends Repository<EventDeclaration, EventDeclarationId> {
  findAll(organizationId: OrganizationId): Promise<readonly EventDeclaration[]>;
  findByExtension(organizationId: OrganizationId, extensionId: ExtensionId): Promise<readonly EventDeclaration[]>;
}
