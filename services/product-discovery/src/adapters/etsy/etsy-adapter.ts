/** @module adapters/etsy/etsy-adapter */
import type { SignalSourceAdapter } from '../shared/signal-source-adapter.js';

/** Contract for Etsy marketplace signal collection. Implementation external. */
export interface EtsyAdapter extends SignalSourceAdapter {
  readonly source: 'etsy';
}
