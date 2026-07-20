/** @module adapters/temu/temu-adapter */
import type { SignalSourceAdapter } from '../shared/signal-source-adapter.js';

/** Contract for Temu marketplace signal collection. Implementation external. */
export interface TemuAdapter extends SignalSourceAdapter {
  readonly source: 'temu';
}
