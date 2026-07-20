/**
 * Domain event foundation for Business DNA.
 * Events follow the `{entity}.{action}` naming convention and are published via Core event bus.
 *
 * Extends shared-kernel {@link DomainEvent} with tenant-scoped organization context.
 *
 * @module shared/domain-event
 */

import type { DomainEvent as SharedDomainEvent, DomainEventName } from '@lateen-os/shared-kernel/core';
import type { EntityId, EventId, OrganizationId } from './identifiers.js';
import type { ISODateTime } from './primitives.js';

export type { DomainEventName };

/** Base domain event structure for all Business DNA aggregates. */
export interface DomainEvent<TEventName extends string = string, TPayload = unknown>
  extends SharedDomainEvent<TEventName, TPayload> {
  readonly eventId: EventId;
  readonly occurredAt: ISODateTime;
  readonly organizationId: OrganizationId;
  readonly aggregateId: EntityId;
}
