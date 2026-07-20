/**
 * Organization value objects (Enrichment v1).
 *
 * @module organization/value-objects
 */

import type {
  AiDecisionThreshold,
  IndustryVertical,
  OperatingModel,
  ProductionModel,
  ServiceCoverage,
  SlaTier,
} from './types.js';

/** AI-first operating configuration for Lateen. */
export interface AiFirstOperations {
  readonly operatingModel: OperatingModel;
  readonly proactiveAiEnabled: boolean;
  readonly aiDecisionThreshold?: AiDecisionThreshold;
}

/** Production and commercial profile for Lateen. */
export interface ProductionProfile {
  readonly industryVerticals: readonly IndustryVertical[];
  readonly productionModel: ProductionModel;
  readonly serviceCoverage: ServiceCoverage;
  readonly defaultSlaTier?: SlaTier;
}
