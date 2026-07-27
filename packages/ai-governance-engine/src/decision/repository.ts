/** @module decision/repository */
import type { Repository } from '../shared/repository.js';
import type { DecisionId, OrganizationId } from '../shared/identifiers.js';
import type { Decision } from './types.js';

export interface DecisionRepository extends Repository<Decision, DecisionId> {
  findAll(organizationId: OrganizationId): Promise<readonly Decision[]>;
  findBySubject(organizationId: OrganizationId, subjectId: string): Promise<readonly Decision[]>;
  findByReviewer(organizationId: OrganizationId, reviewerId: string): Promise<readonly Decision[]>;
}
