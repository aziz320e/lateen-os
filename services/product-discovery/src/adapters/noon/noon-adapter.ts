/** @module adapters/noon/noon-adapter */
import type { SignalSourceAdapter } from '../shared/signal-source-adapter.js';

/** Contract for Noon marketplace signal collection. Implementation external. */
export interface NoonAdapter extends SignalSourceAdapter {
  readonly source: 'noon';
}
