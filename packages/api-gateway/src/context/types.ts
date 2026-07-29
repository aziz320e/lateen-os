/** @module context/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { RequestContextId } from '../shared/identifiers.js';
import type { HttpMethod, ISODateTime } from '../shared/primitives.js';

export type { RequestContextId };

export type RequestContextStatus = 'in_flight' | 'completed' | 'rejected';

/** One real, tracked request as it moves through the gateway — its `id` doubles as the correlation id. */
export interface RequestContext extends TenantAuditableEntity<RequestContextId> {
  readonly method: HttpMethod;
  readonly path: string;
  readonly principalId?: string;
  readonly startedAt: ISODateTime;
  readonly completedAt?: ISODateTime;
  readonly statusCode?: number;
  readonly rejectionReason?: string;
  readonly status: RequestContextStatus;
}
