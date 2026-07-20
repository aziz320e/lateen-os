/** @module adapters/amazon/amazon-adapter */
import type { SignalSourceAdapter } from '../shared/signal-source-adapter.js';

/** Contract for Amazon marketplace signal collection. Implementation external. */
export interface AmazonAdapter extends SignalSourceAdapter {
  readonly source: 'amazon';
}
