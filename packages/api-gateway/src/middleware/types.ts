/** @module middleware/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { MiddlewareStepId } from '../shared/identifiers.js';

export type { MiddlewareStepId };

export type MiddlewareStepKind = 'authentication' | 'authorization' | 'validation' | 'rateLimit' | 'custom';

/** One named, ordered stage of the request pipeline — the Runtime Dispatcher executes enabled steps in ascending `sequence` order. */
export interface MiddlewareStep extends TenantAuditableEntity<MiddlewareStepId> {
  readonly name: string;
  readonly sequence: number;
  readonly kind: MiddlewareStepKind;
  readonly enabled: boolean;
}
