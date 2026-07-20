/** @module adapters/google-trends/google-trends-adapter */
import type { SignalSourceAdapter } from '../shared/signal-source-adapter.js';

/** Contract for Google Trends signal collection. Implementation external. */
export interface GoogleTrendsAdapter extends SignalSourceAdapter {
  readonly source: 'google_trends';
}
