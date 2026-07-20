/** @module shared/domain-event */
import type {
  DomainEvent as SharedDomainEvent,
  DomainEventName,
} from '@lateen-os/shared-kernel/core';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { CorrelationId, OrganizationId } from './primitives.js';

export type { DomainEventName };

export interface DomainEvent<TEventName extends string = string, TPayload = unknown>
  extends SharedDomainEvent<TEventName, TPayload> {
  readonly eventId: Identifier;
  readonly occurredAt: string;
  readonly organizationId: OrganizationId;
  readonly aggregateId: Identifier;
  readonly correlationId?: CorrelationId;
}
