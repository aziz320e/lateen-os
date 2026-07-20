/**
 * Machine value objects (Enrichment v1).
 * @module machine/value-objects
 */

import type {
  ColorCapability,
  PrintTechnology,
  ProductionMachineType,
  SupportedMaterial,
  ThroughputUnit,
} from './types.js';

/** Physical production capabilities of a machine. */
export interface ProductionCapabilities {
  readonly type: ProductionMachineType;
  readonly maxWidthMm?: number;
  readonly maxLengthMm?: number;
  readonly maxThicknessMm?: string;
  readonly supportedMaterials?: readonly SupportedMaterial[];
  readonly printTechnology?: PrintTechnology;
  readonly colorCapability?: ColorCapability;
  readonly cutCapability?: boolean;
  readonly routingCapability?: boolean;
  readonly laminationCapability?: boolean;
}

/** Throughput and cost profile for job routing and profitability. */
export interface MachineThroughputProfile {
  readonly throughputUnitsPerHour?: string;
  readonly throughputUnit?: ThroughputUnit;
  readonly setupTimeMinutes?: number;
  readonly costPerHour?: string;
  readonly costPerUnit?: string;
  readonly utilizationTargetPct?: string;
}
