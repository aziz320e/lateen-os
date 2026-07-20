/** @module decision/repository */
import type { DecisionId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Decision, DecisionCategory, DecisionStatus } from './types.js';

export interface DecisionRepository extends Repository<Decision, DecisionId> {
  findByCategory(
    organizationId: OrganizationId,
    category: DecisionCategory,
  ): Promise<readonly Decision[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: DecisionStatus,
  ): Promise<readonly Decision[]>;
}
