/** @module agent/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { AgentGroup, AgentGroupId, AgentRegistration, AgentRegistrationId } from './types.js';

export interface AgentRegistrationRepository extends Repository<AgentRegistration, AgentRegistrationId> {
  findAll(organizationId: OrganizationId): Promise<readonly AgentRegistration[]>;
}
export interface AgentGroupRepository extends Repository<AgentGroup, AgentGroupId> {
  findAll(organizationId: OrganizationId): Promise<readonly AgentGroup[]>;
}
