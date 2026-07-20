/**
 * Domain event foundation for event-driven integration.
 *
 * Events follow the `{aggregate}.{action}` naming convention.
 * Dispatch and handlers live in Core (Layer 2).
 *
 * @module core/domain-event
 */

import type { Identifier } from '../identity/identifier.js';
import type { Timestamp } from '../time/timestamp.js';

/** Base domain event structure. */
export interface DomainEvent<TEventName extends string = string, TPayload = unknown> {
  readonly eventId: Identifier;
  readonly eventName: TEventName;
  readonly occurredAt: Timestamp;
  readonly aggregateId: Identifier;
  readonly payload: TPayload;
}

/** Factory type for strongly-typed domain event names (`{entity}.{action}`). */
export type DomainEventName<TEntity extends string, TAction extends string> =
  `${TEntity}.${TAction}`;
