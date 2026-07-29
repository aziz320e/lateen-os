/** @module middleware/repository */
import type { Repository } from '../shared/repository.js';
import type { MiddlewareStepId, OrganizationId } from '../shared/identifiers.js';
import type { MiddlewareStep } from './types.js';

export interface MiddlewareStepRepository extends Repository<MiddlewareStep, MiddlewareStepId> {
  findAll(organizationId: OrganizationId): Promise<readonly MiddlewareStep[]>;
}
