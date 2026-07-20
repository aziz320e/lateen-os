/**
 * Capability query port — read-side interfaces for capability graph traversal.
 *
 * Implementations live outside this package (infrastructure / application layer).
 * No query logic is provided here — contracts only.
 *
 * @module queries/capability-queries
 */

import type { Capability } from '../capability/types.js';
import type {
  CapabilityId,
  MachineId,
  OrganizationId,
  ProductId,
  ServiceId,
} from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { HighDemandCapability, MissingCapability } from './types.js';

/** Read-side query port for cross-aggregate capability analysis. */
export interface CapabilityQueries {
  /** All capabilities a machine can provide. */
  findCapabilitiesByMachine(
    organizationId: OrganizationId,
    machineId: MachineId,
  ): Promise<readonly Capability[]>;

  /** All capabilities required to produce a product. */
  findCapabilitiesByProduct(
    organizationId: OrganizationId,
    productId: ProductId,
  ): Promise<readonly Capability[]>;

  /** All products that require a given capability. */
  findProductsByCapability(
    organizationId: OrganizationId,
    capabilityId: CapabilityId,
  ): Promise<readonly ProductId[]>;

  /** All machines that provide a given capability. */
  findMachinesByCapability(
    organizationId: OrganizationId,
    capabilityId: CapabilityId,
  ): Promise<readonly MachineId[]>;

  /** All services that consume a given capability. */
  findServicesByCapability(
    organizationId: OrganizationId,
    capabilityId: CapabilityId,
  ): Promise<readonly ServiceId[]>;

  /** Active capabilities with no machine, product, or service links. */
  findUnusedCapabilities(
    query: OrganizationScopedQuery,
  ): Promise<readonly Capability[]>;

  /** Required capabilities with no machine provider. */
  findMissingCapabilities(
    query: OrganizationScopedQuery,
  ): Promise<readonly MissingCapability[]>;

  /** Capabilities where demand exceeds available machine supply. */
  findHighDemandCapabilities(
    query: OrganizationScopedQuery,
  ): Promise<readonly HighDemandCapability[]>;
}
