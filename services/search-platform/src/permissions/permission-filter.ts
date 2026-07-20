import type { SearchHit, SearchRequest } from '../domain/types.js';

export interface PermissionContext {
  readonly organizationId: string;
  readonly userId?: string;
  readonly roles: readonly string[];
  readonly department?: string;
}

/** Permission filtering port — tenant isolation and access control. */
export interface PermissionFilter {
  filter(hits: readonly SearchHit[], context: PermissionContext, request: SearchRequest): readonly SearchHit[];
}

export class DefaultPermissionFilter implements PermissionFilter {
  filter(hits: readonly SearchHit[], context: PermissionContext, request: SearchRequest): readonly SearchHit[] {
    return hits.filter((hit) => {
      const orgId = hit.metadata.organizationId as string | undefined;
      if (orgId && orgId !== context.organizationId && orgId !== request.filters.organizationId) {
        return false;
      }
      const classification = hit.metadata.classification as string | undefined;
      if (classification === 'restricted' && !context.roles.includes('admin')) {
        return false;
      }
      if (request.filters.department && hit.metadata.department && hit.metadata.department !== request.filters.department) {
        return false;
      }
      return true;
    });
  }
}
