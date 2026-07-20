/** @module runtime/repository */
import type { OrganizationId, RuntimeAgentId, RuntimeSessionId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { RuntimeSession, RuntimeState } from './types.js';

export interface RuntimeSessionRepository extends Repository<RuntimeSession, RuntimeSessionId> {
  findByAgent(
    organizationId: OrganizationId,
    runtimeAgentId: RuntimeAgentId,
  ): Promise<readonly RuntimeSession[]>;
  findActiveByAgent(
    organizationId: OrganizationId,
    runtimeAgentId: RuntimeAgentId,
  ): Promise<RuntimeSession | null>;
  findByState(
    organizationId: OrganizationId,
    state: RuntimeState,
  ): Promise<readonly RuntimeSession[]>;
}
