/** @module policy/value-objects */
import type { PolicyConstraint, PolicyScope } from './types.js';

/** Scoped constraint set. */
export interface ScopedPolicyConstraints {
  readonly scope: PolicyScope;
  readonly constraints: readonly PolicyConstraint[];
}
