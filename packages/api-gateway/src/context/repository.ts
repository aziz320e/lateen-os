/** @module context/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, RequestContextId } from '../shared/identifiers.js';
import type { RequestContext } from './types.js';

export interface RequestContextRepository extends Repository<RequestContext, RequestContextId> {
  findAll(organizationId: OrganizationId): Promise<readonly RequestContext[]>;
}
