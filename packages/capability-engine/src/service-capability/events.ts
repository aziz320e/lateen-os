/** @module service-capability/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { CapabilityId, ServiceId } from '../shared/identifiers.js';

export type ServiceCapabilityEventName =
  | DomainEventName<'service_capability', 'linked'>
  | DomainEventName<'service_capability', 'unlinked'>
  | DomainEventName<'service_capability', 'activated'>
  | DomainEventName<'service_capability', 'deactivated'>
  | DomainEventName<'service_capability', 'updated'>;

export type ServiceCapabilityDomainEvent =
  | DomainEvent<
      'service_capability.linked',
      { readonly serviceId: ServiceId; readonly capabilityId: CapabilityId }
    >
  | DomainEvent<
      'service_capability.unlinked',
      { readonly serviceId: ServiceId; readonly capabilityId: CapabilityId }
    >
  | DomainEvent<'service_capability.activated', Record<string, unknown>>
  | DomainEvent<'service_capability.deactivated', Record<string, unknown>>
  | DomainEvent<'service_capability.updated', Record<string, unknown>>;
