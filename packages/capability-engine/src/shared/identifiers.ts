/**
 * Identifier types for the Capability Engine bounded context.
 *
 * Business DNA entity IDs are re-exported for cross-context references.
 * Capability-scoped IDs are defined here.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type {
  MachineId,
  OrganizationId,
  ProductId,
  ServiceId,
} from '@lateen-os/business-dna';

/** Capability aggregate identifier. */
export type CapabilityId = Identifier;

/** Machine–capability link identifier. */
export type MachineCapabilityId = Identifier;

/** Product–capability requirement identifier. */
export type ProductCapabilityId = Identifier;

/** Service–capability consumption identifier. */
export type ServiceCapabilityId = Identifier;
