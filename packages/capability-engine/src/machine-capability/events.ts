/** @module machine-capability/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { CapabilityId, MachineId } from '../shared/identifiers.js';

export type MachineCapabilityEventName =
  | DomainEventName<'machine_capability', 'linked'>
  | DomainEventName<'machine_capability', 'unlinked'>
  | DomainEventName<'machine_capability', 'activated'>
  | DomainEventName<'machine_capability', 'deactivated'>
  | DomainEventName<'machine_capability', 'updated'>;

export type MachineCapabilityDomainEvent =
  | DomainEvent<
      'machine_capability.linked',
      { readonly machineId: MachineId; readonly capabilityId: CapabilityId }
    >
  | DomainEvent<
      'machine_capability.unlinked',
      { readonly machineId: MachineId; readonly capabilityId: CapabilityId }
    >
  | DomainEvent<'machine_capability.activated', Record<string, unknown>>
  | DomainEvent<'machine_capability.deactivated', Record<string, unknown>>
  | DomainEvent<'machine_capability.updated', Record<string, unknown>>;
