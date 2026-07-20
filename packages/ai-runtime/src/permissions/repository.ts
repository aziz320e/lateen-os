/** @module permissions/repository */
import type { OrganizationId, RuntimeAgentId } from '../shared/identifiers.js';
import type { ReadRepository, WriteRepository } from '../shared/repository.js';
import type { AgentPermission } from './types.js';

export interface AgentPermissionRepository
  extends ReadRepository<AgentPermission, RuntimeAgentId>,
    WriteRepository<AgentPermission, RuntimeAgentId> {
  findByOrganization(organizationId: OrganizationId): Promise<readonly AgentPermission[]>;
}
