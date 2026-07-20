/**
 * Base entity interface — all domain entities have a stable identity.
 *
 * @module core/entity
 */

import type { Identifier } from '../identity/identifier.js';

/** Root interface for entities distinguished by identity (reference equality by id). */
export interface Entity<TId extends Identifier = Identifier> {
  readonly id: TId;
}
