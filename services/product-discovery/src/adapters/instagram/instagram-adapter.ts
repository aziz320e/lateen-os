/** @module adapters/instagram/instagram-adapter */
import type { SignalSourceAdapter } from '../shared/signal-source-adapter.js';

/** Contract for Instagram trend signal collection. Implementation external. */
export interface InstagramAdapter extends SignalSourceAdapter {
  readonly source: 'instagram';
}
