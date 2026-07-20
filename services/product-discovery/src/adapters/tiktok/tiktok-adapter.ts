/** @module adapters/tiktok/tiktok-adapter */
import type { SignalSourceAdapter } from '../shared/signal-source-adapter.js';

/** Contract for TikTok trend signal collection. Implementation external. */
export interface TikTokAdapter extends SignalSourceAdapter {
  readonly source: 'tiktok';
}
