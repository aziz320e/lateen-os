/**
 * Service–capability relation value objects.
 *
 * @module service-capability/value-objects
 */

import type { CapabilityId } from '../shared/identifiers.js';

/** Estimated capability units consumed when delivering a service. */
export interface CapabilityConsumption {
  readonly capabilityId: CapabilityId;
  readonly quantity?: string;
}
