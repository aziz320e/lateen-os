/** @module agent/repository */
import type { AgentId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Agent, WorkforceType } from './types.js';

export interface AgentRepository extends Repository<Agent, AgentId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Agent | null>;
  findByWorkforceType(
    organizationId: OrganizationId,
    workforceType: WorkforceType,
  ): Promise<readonly Agent[]>;
}
