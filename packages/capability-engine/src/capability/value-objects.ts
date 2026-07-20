/**
 * Capability value objects.
 *
 * @module capability/value-objects
 */

import type { CapabilityCategory } from './types.js';

/** Semantic label attached to a capability for discovery and filtering. */
export interface CapabilityTag {
  readonly value: string;
}

/** Monotonically increasing capability definition version. */
export interface CapabilityVersion {
  readonly value: number;
}

/** Grouping of capabilities by production category. */
export interface CapabilityCategoryGroup {
  readonly category: CapabilityCategory;
  readonly label: string;
}
