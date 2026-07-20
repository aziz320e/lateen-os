/** @module domain/signal */
import type { Timestamp } from '@lateen-os/shared-kernel/time';
import type { MarketSignalId, OrganizationId } from './identifiers.js';
import type { ScoreValue } from './primitives.js';

export type SignalSource =
  | 'google_trends'
  | 'tiktok'
  | 'instagram'
  | 'alibaba'
  | 'etsy'
  | 'amazon'
  | 'temu'
  | 'noon';

export type SignalCategory =
  | 'trend'
  | 'search_volume'
  | 'social_engagement'
  | 'marketplace_listing'
  | 'price_point'
  | 'review_sentiment';

/** Raw market signal collected from an external source adapter. */
export interface MarketSignal {
  readonly signalId: MarketSignalId;
  readonly organizationId: OrganizationId;
  readonly source: SignalSource;
  readonly category: SignalCategory;
  readonly title: string;
  readonly keyword?: string;
  readonly rawPayload: Readonly<Record<string, unknown>>;
  readonly strength?: ScoreValue;
  readonly collectedAt: Timestamp;
}

export interface CollectSignalsResult {
  readonly runId: string;
  readonly signals: readonly MarketSignal[];
  readonly sourceCounts: Readonly<Partial<Record<SignalSource, number>>>;
}
