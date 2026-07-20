/**
 * Query result shapes for Capability Engine read models.
 *
 * @module queries/types
 */

import type { Capability } from '../capability/types.js';
import type {
  CapabilityId,
  MachineId,
  ProductId,
  ServiceId,
} from '../shared/identifiers.js';

/** A required capability with no active machine provider. */
export interface MissingCapability {
  readonly capabilityId: CapabilityId;
  readonly capabilityCode: string;
  readonly productIds: readonly ProductId[];
}

/** A capability with high downstream demand relative to machine supply. */
export interface HighDemandCapability {
  readonly capabilityId: CapabilityId;
  readonly capabilityCode: string;
  readonly productCount: number;
  readonly serviceCount: number;
  readonly machineCount: number;
}

/** Capabilities linked to a single machine. */
export interface MachineCapabilityView {
  readonly machineId: MachineId;
  readonly capabilities: readonly Capability[];
}

/** Capabilities required by a single product. */
export interface ProductCapabilityView {
  readonly productId: ProductId;
  readonly capabilities: readonly Capability[];
}

/** Machines that provide a given capability. */
export interface CapabilityMachineView {
  readonly capabilityId: CapabilityId;
  readonly machineIds: readonly MachineId[];
}

/** Products that require a given capability. */
export interface CapabilityProductView {
  readonly capabilityId: CapabilityId;
  readonly productIds: readonly ProductId[];
}

/** Services that consume a given capability. */
export interface CapabilityServiceView {
  readonly capabilityId: CapabilityId;
  readonly serviceIds: readonly ServiceId[];
}
