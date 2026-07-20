/**
 * Machine–capability relation value objects.
 *
 * @module machine-capability/value-objects
 */

import type { CapabilityId } from '../shared/identifiers.js';

/** Relative ordering when multiple machines provide the same capability. */
export interface MachineCapabilityPriority {
  readonly value: number;
}

/** Reference to a capability supplied by a machine. */
export interface ProvidedCapability {
  readonly capabilityId: CapabilityId;
}
