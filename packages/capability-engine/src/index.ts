/**
 * @lateen-os/capability-engine — Capability Engine
 *
 * Models what the company is capable of doing, independent of specific machines.
 * A capability can be provided by machines, required by products, and consumed by services.
 *
 * Pure TypeScript DDD — types, value objects, events, repository ports, and query ports only.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';

export * as capability from './capability/index.js';
export * as machineCapability from './machine-capability/index.js';
export * as productCapability from './product-capability/index.js';
export * as serviceCapability from './service-capability/index.js';
export * as queries from './queries/index.js';

/** Capability aggregate root. */
export type { Capability, CapabilityCategory, CapabilityStatus } from './capability/types.js';
export type { CapabilityId } from './capability/types.js';

/** Machine–capability relation. */
export type {
  MachineCapability,
  MachineCapabilityStatus,
  MachineCapabilityId,
} from './machine-capability/types.js';

/** Product–capability relation. */
export type {
  ProductCapability,
  ProductCapabilityStatus,
  ProductCapabilityId,
} from './product-capability/types.js';

/** Service–capability relation. */
export type {
  ServiceCapability,
  ServiceCapabilityStatus,
  ServiceCapabilityId,
} from './service-capability/types.js';

/** Repository ports. */
export type { CapabilityRepository } from './capability/repository.js';
export type { MachineCapabilityRepository } from './machine-capability/repository.js';
export type { ProductCapabilityRepository } from './product-capability/repository.js';
export type { ServiceCapabilityRepository } from './service-capability/repository.js';

/** Query port and read-model types. */
export type { CapabilityQueries } from './queries/capability-queries.js';
export type {
  MissingCapability,
  HighDemandCapability,
  MachineCapabilityView,
  ProductCapabilityView,
  CapabilityMachineView,
  CapabilityProductView,
  CapabilityServiceView,
} from './queries/types.js';

/** Re-exported Business DNA identifiers used in relations. */
export type {
  OrganizationId,
  MachineId,
  ProductId,
  ServiceId,
} from './shared/identifiers.js';
