/** @module adapters/alibaba/alibaba-adapter */
import type { SignalSourceAdapter } from '../shared/signal-source-adapter.js';

/** Contract for Alibaba marketplace signal collection. Implementation external. */
export interface AlibabaAdapter extends SignalSourceAdapter {
  readonly source: 'alibaba';
}
