/** @module adapters/shared/signal-source-adapter */
import type {
  CollectMarketSignalsRequest,
  CollectMarketSignalsResponse,
  SignalSourcePort,
} from '../../ports/outbound/signal-source-port.js';
import type { SignalSource } from '../../domain/signal.js';

/** Base contract for all market signal source adapters. */
export interface SignalSourceAdapter extends SignalSourcePort {
  readonly source: SignalSource;
  collectSignals(request: CollectMarketSignalsRequest): Promise<CollectMarketSignalsResponse>;
}

export type { SignalSource };
