/** @module domain/normalized-signal */
import type { MarketSignalId, NormalizedSignalId, OrganizationId } from './identifiers.js';
import type { SignalCategory, SignalSource } from './signal.js';
import type { ScoreValue } from './primitives.js';

/** Canonical signal after normalization across sources. */
export interface NormalizedSignal {
  readonly normalizedSignalId: NormalizedSignalId;
  readonly organizationId: OrganizationId;
  readonly sourceSignalIds: readonly MarketSignalId[];
  readonly primarySource: SignalSource;
  readonly category: SignalCategory;
  readonly productConcept: string;
  readonly keywords: readonly string[];
  readonly demandScore: ScoreValue;
  readonly confidence: ScoreValue;
}

export interface NormalizeSignalsResult {
  readonly signals: readonly NormalizedSignal[];
}
