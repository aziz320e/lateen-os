import type { RequestMetrics } from '../domain/types';

export class MetricsService {
  private metrics: RequestMetrics = {
    totalRequests: 0,
    proxyErrors: 0,
    rateLimited: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  recordRequest(): void {
    this.metrics.totalRequests += 1;
  }

  recordProxyError(): void {
    this.metrics.proxyErrors += 1;
  }

  recordRateLimited(): void {
    this.metrics.rateLimited += 1;
  }

  recordCacheHit(): void {
    this.metrics.cacheHits += 1;
  }

  recordCacheMiss(): void {
    this.metrics.cacheMisses += 1;
  }

  snapshot(): RequestMetrics {
    return { ...this.metrics };
  }

  toPrometheus(): string {
    const m = this.metrics;
    return [
      '# HELP lateen_gateway_requests_total Total gateway requests',
      '# TYPE lateen_gateway_requests_total counter',
      `lateen_gateway_requests_total ${m.totalRequests}`,
      '# HELP lateen_gateway_proxy_errors_total Total proxy errors',
      '# TYPE lateen_gateway_proxy_errors_total counter',
      `lateen_gateway_proxy_errors_total ${m.proxyErrors}`,
      '# HELP lateen_gateway_rate_limited_total Total rate limited requests',
      '# TYPE lateen_gateway_rate_limited_total counter',
      `lateen_gateway_rate_limited_total ${m.rateLimited}`,
      '# HELP lateen_gateway_cache_hits_total Total cache hits',
      '# TYPE lateen_gateway_cache_hits_total counter',
      `lateen_gateway_cache_hits_total ${m.cacheHits}`,
      '# HELP lateen_gateway_cache_misses_total Total cache misses',
      '# TYPE lateen_gateway_cache_misses_total counter',
      `lateen_gateway_cache_misses_total ${m.cacheMisses}`,
    ].join('\n');
  }
}
