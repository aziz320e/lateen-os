/**
 * Product–capability relation value objects.
 *
 * @module product-capability/value-objects
 */

import type { CapabilityId } from '../shared/identifiers.js';

/** Ordering of capability requirements in a product production flow. */
export interface CapabilityRequirementSequence {
  readonly value: number;
}

/** A capability required to produce a product. */
export interface RequiredCapability {
  readonly capabilityId: CapabilityId;
  readonly required: boolean;
}
