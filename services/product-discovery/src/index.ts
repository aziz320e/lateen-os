/**
 * @lateen-os/product-discovery-service — Product Discovery Platform
 *
 * First executable service of Lateen OS.
 * Discovers manufacturable business opportunities using existing capabilities.
 *
 * @packageDocumentation
 */

export * from './domain/index.js';

export * as ports from './ports/index.js';
export * as adapters from './adapters/index.js';
export * as workflows from './workflows/index.js';
export * as application from './application/index.js';
export * as infrastructure from './infrastructure/index.js';

export type { ProductDiscoveryService } from './ports/inbound/product-discovery-service.js';
export type { ProductDiscoveryWorkflow } from './workflows/product-discovery-workflow.js';
export type { ProductDiscoveryApplicationService } from './application/product-discovery-application.js';
export type { ProductDiscoveryCompositionRoot } from './infrastructure/composition-root.js';
export type { ProductDiscoveryModule } from './infrastructure/module.js';

export type {
  MarketSignal,
  SignalSource,
  NormalizedSignal,
  RankedOpportunity,
  CapabilityMatch,
  ProfitEstimate,
  DecisionSubmission,
  DiscoveryRecommendation,
  ProductDiscoveryRun,
} from './domain/index.js';

export type {
  GoogleTrendsAdapter,
  TikTokAdapter,
  InstagramAdapter,
  AlibabaAdapter,
  EtsyAdapter,
  AmazonAdapter,
  TemuAdapter,
  NoonAdapter,
  ProductDiscoverySignalAdapter,
} from './adapters/index.js';
