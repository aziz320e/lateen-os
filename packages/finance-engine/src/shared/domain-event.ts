/**
 * Domain event foundation for the Finance Engine.
 *
 * @module shared/domain-event
 */

import type { DomainEvent as SharedDomainEvent, DomainEventName } from '@lateen-os/shared-kernel/core';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { Timestamp } from '@lateen-os/shared-kernel/time';
import type { OrganizationId } from './identifiers.js';

export type { DomainEventName };

/** Base domain event structure for all Finance Engine aggregates. */
export interface DomainEvent<TEventName extends string = string, TPayload = unknown>
  extends SharedDomainEvent<TEventName, TPayload> {
  readonly eventId: Identifier;
  readonly occurredAt: Timestamp;
  readonly organizationId: OrganizationId;
  readonly aggregateId: Identifier;
}
