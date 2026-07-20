/** @module context/repository */
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { DecisionContextId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { DecisionContext } from './types.js';

export interface DecisionContextRepository extends Repository<DecisionContext, DecisionContextId> {
  findByDecision(
    organizationId: OrganizationId,
    decisionId: Identifier,
  ): Promise<DecisionContext | null>;
}
