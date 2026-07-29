/** @module authorization/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { PolicyId } from '../shared/identifiers.js';

export type { PolicyId };

export type PolicyEffect = 'allow' | 'deny';

export type PolicyStatus = 'active' | 'inactive';

/**
 * A single authorization rule. `resource` and `action` may be an
 * exact string or end in `*` for a prefix match (e.g. `/api/crm/*`,
 * `GET`). Evaluation is deterministic: among every policy whose
 * resource and action match, the highest-`priority` match wins;
 * ties break toward `deny`. No match at all is also a deny.
 */
export interface Policy extends TenantAuditableEntity<PolicyId> {
  readonly name: string;
  readonly effect: PolicyEffect;
  readonly resource: string;
  readonly action: string;
  readonly principalScope?: string;
  readonly priority: number;
  readonly status: PolicyStatus;
}
