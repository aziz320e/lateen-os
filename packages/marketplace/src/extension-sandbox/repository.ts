/** @module extension-sandbox/repository */
import type { Repository } from '../shared/repository.js';
import type { ExtensionId, OrganizationId, SandboxProfileId } from '../shared/identifiers.js';
import type { SandboxProfile } from './types.js';

export interface SandboxProfileRepository extends Repository<SandboxProfile, SandboxProfileId> {
  findAll(organizationId: OrganizationId): Promise<readonly SandboxProfile[]>;
  findByExtension(organizationId: OrganizationId, extensionId: ExtensionId): Promise<SandboxProfile | null>;
}
