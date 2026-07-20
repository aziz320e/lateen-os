import { createHash, randomUUID } from 'node:crypto';
import type { MarketSignalId, OrganizationId } from '../../domain/identifiers.js';
import type { MarketSignal, SignalSource } from '../../domain/signal.js';
import type { SignalSourceAdapter } from '../../adapters/shared/signal-source-adapter.js';
import type {
  CollectMarketSignalsRequest,
  CollectMarketSignalsResponse,
} from '../../ports/outbound/signal-source-port.js';

const DEFAULT_KEYWORDS = ['signage', 'vehicle wrap', 'acrylic display', 'led board'];

function deterministicScore(source: SignalSource, keyword: string, index: number): string {
  const hash = createHash('sha256').update(`${source}:${keyword}:${index}`).digest('hex');
  const value = 0.55 + (parseInt(hash.slice(0, 2), 16) / 255) * 0.4;
  return value.toFixed(2);
}

export function createMockSignalAdapter(source: SignalSource): SignalSourceAdapter {
  return {
    source,
    async collectSignals(request: CollectMarketSignalsRequest): Promise<CollectMarketSignalsResponse> {
      const keywords = request.keywords?.length ? [...request.keywords] : DEFAULT_KEYWORDS;
      const limit = request.limit ?? 2;
      const selected = keywords.slice(0, limit);

      const signals: MarketSignal[] = selected.map((keyword, index) => ({
        signalId: randomUUID() as MarketSignalId,
        organizationId: request.organizationId as OrganizationId,
        source,
        category: index % 2 === 0 ? 'trend' : 'search_volume',
        title: `${keyword} opportunity (${source})`,
        keyword,
        rawPayload: {
          source,
          keyword,
          mock: true,
          rank: index + 1,
          region: 'MENA',
        },
        strength: deterministicScore(source, keyword, index),
        collectedAt: new Date().toISOString(),
      }));

      return { source, signals };
    },
  };
}

export function createAllMockAdapters(): SignalSourceAdapter[] {
  const sources: SignalSource[] = [
    'google_trends',
    'tiktok',
    'instagram',
    'alibaba',
    'etsy',
    'amazon',
    'temu',
    'noon',
  ];
  return sources.map(createMockSignalAdapter);
}
