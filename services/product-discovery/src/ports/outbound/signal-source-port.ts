/** @module ports/outbound/signal-source-port */
import type { CollectSignalsResult, MarketSignal, SignalSource } from '../../domain/signal.js';
import type { OrganizationId } from '../../domain/identifiers.js';

export interface CollectMarketSignalsRequest {
  readonly organizationId: OrganizationId;
  readonly keywords?: readonly string[];
  readonly categories?: readonly string[];
  readonly limit?: number;
}

export interface CollectMarketSignalsResponse {
  readonly source: SignalSource;
  readonly signals: readonly MarketSignal[];
}

/** Outbound port for external market signal sources. */
export interface SignalSourcePort {
  readonly source: SignalSource;
  collectSignals(request: CollectMarketSignalsRequest): Promise<CollectMarketSignalsResponse>;
}

export interface SignalAggregatorPort {
  collectFromAllSources(request: CollectMarketSignalsRequest): Promise<CollectSignalsResult>;
}
