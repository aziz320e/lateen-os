/** @module adapters */
export type { SignalSourceAdapter } from './shared/signal-source-adapter.js';
export type { GoogleTrendsAdapter } from './google-trends/google-trends-adapter.js';
export type { TikTokAdapter } from './tiktok/tiktok-adapter.js';
export type { InstagramAdapter } from './instagram/instagram-adapter.js';
export type { AlibabaAdapter } from './alibaba/alibaba-adapter.js';
export type { EtsyAdapter } from './etsy/etsy-adapter.js';
export type { AmazonAdapter } from './amazon/amazon-adapter.js';
export type { TemuAdapter } from './temu/temu-adapter.js';
export type { NoonAdapter } from './noon/noon-adapter.js';

/** All supported signal source adapter contracts. */
export type ProductDiscoverySignalAdapter =
  | import('./google-trends/google-trends-adapter.js').GoogleTrendsAdapter
  | import('./tiktok/tiktok-adapter.js').TikTokAdapter
  | import('./instagram/instagram-adapter.js').InstagramAdapter
  | import('./alibaba/alibaba-adapter.js').AlibabaAdapter
  | import('./etsy/etsy-adapter.js').EtsyAdapter
  | import('./amazon/amazon-adapter.js').AmazonAdapter
  | import('./temu/temu-adapter.js').TemuAdapter
  | import('./noon/noon-adapter.js').NoonAdapter;
