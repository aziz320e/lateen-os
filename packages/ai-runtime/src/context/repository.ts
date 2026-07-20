/** @module context/repository */
import type { AgentContextId, OrganizationId, RuntimeSessionId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { AgentContext } from './types.js';

export interface AgentContextRepository extends Repository<AgentContext, AgentContextId> {
  findBySession(
    organizationId: OrganizationId,
    sessionId: RuntimeSessionId,
  ): Promise<AgentContext | null>;
}
