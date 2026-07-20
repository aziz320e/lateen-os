import type { CollectSignalsResult } from '../domain/signal.js';
import type {
  CollectMarketSignalsRequest,
  SignalAggregatorPort,
} from '../ports/outbound/signal-source-port.js';
import type { ProductDiscoverySignalAdapter } from '../adapters/index.js';
import type { CacheStore } from './cache/redis-cache.js';

export class CachedSignalAggregator implements SignalAggregatorPort {
  constructor(
    private readonly adapters: readonly ProductDiscoverySignalAdapter[],
    private readonly cache: CacheStore,
  ) {}

  async collectFromAllSources(request: CollectMarketSignalsRequest): Promise<CollectSignalsResult> {
    const cacheKey = `signals:${request.organizationId}:${(request.keywords ?? []).join(',')}`;
    const cached = await this.cache.get<CollectSignalsResult>(cacheKey);
    if (cached) return cached;

    const responses = await Promise.all(
      this.adapters.map((adapter) => adapter.collectSignals(request)),
    );

    const signals = responses.flatMap((response) => response.signals);
    const sourceCounts: Partial<Record<string, number>> = {};
    for (const response of responses) {
      sourceCounts[response.source] = response.signals.length;
    }

    const result: CollectSignalsResult = {
      runId: '',
      signals,
      sourceCounts,
    };

    await this.cache.set(cacheKey, result);
    return result;
  }
}
