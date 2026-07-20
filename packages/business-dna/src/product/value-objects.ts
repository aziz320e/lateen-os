/**
 * Product value objects (Enrichment v1).
 * @module product/value-objects
 */

import type {
  FinishingStep,
  PrimaryMaterial,
  ProductionType,
} from './types.js';
import type { MachineId } from '../shared/identifiers.js';

/** Manufacturing specification for routing jobs to machines. */
export interface ManufacturingSpec {
  readonly productionType: ProductionType;
  readonly primaryMaterial?: PrimaryMaterial;
  readonly materialThicknessMm?: string;
  readonly finishingSteps?: readonly FinishingStep[];
  readonly approvedMachineIds: readonly MachineId[];
  readonly productionLeadTimeDays?: number;
}

/** Profitability breakdown for margin tracking. */
export interface ProfitabilityProfile {
  readonly costPrice?: string;
  readonly materialCost?: string;
  readonly laborCost?: string;
  readonly machineCost?: string;
  readonly targetMarginPct?: string;
  readonly actualMarginPct?: string;
}

/** AI and Intelligence metadata on a product (written by agents, not manually overridden). */
export interface ProductAiMetadata {
  readonly aiDemandRisk?: import('./types.js').AiDemandRisk;
  readonly aiProductionRisk?: import('./types.js').AiProductionRisk;
  readonly aiPricingRecommendation?: string;
  readonly aiSummary?: string;
}
