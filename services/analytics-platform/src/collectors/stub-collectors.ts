import type { AnalyticsDomain } from '../domain/types.js';
import type { RawDataPoint, SourceCollectorPort } from './source-collector.js';

function stubPoints(source: string, metrics: Record<string, number>): RawDataPoint[] {
  const ts = new Date().toISOString();
  return Object.entries(metrics).map(([metric, value]) => ({ source, metric, value, timestamp: ts }));
}

export class StubSourceCollector implements SourceCollectorPort {
  constructor(
    readonly domain: AnalyticsDomain,
    private readonly metrics: Record<string, number>,
    private readonly source: string,
  ) {}

  async collect(_organizationId: string): Promise<readonly RawDataPoint[]> {
    return stubPoints(this.source, this.metrics);
  }
}

export function createDefaultCollectors(): SourceCollectorPort[] {
  return [
    new StubSourceCollector('executive', { revenue: 1_250_000, profit: 312_000, 'gross-margin': 0.42 }, 'business-dna'),
    new StubSourceCollector('sales', { pipeline: 890_000, conversion: 0.24, revenue: 450_000 }, 'business-dna'),
    new StubSourceCollector('finance', { revenue: 1_250_000, profit: 312_000, 'gross-margin': 0.42 }, 'business-dna'),
    new StubSourceCollector('operations', { 'machine-utilization': 0.78, 'production-time': 4200, downtime: 120 }, 'business-dna'),
    new StubSourceCollector('production', { 'machine-utilization': 0.82, 'quality-score': 0.94, 'production-time': 3800 }, 'business-dna'),
    new StubSourceCollector('projects', { pipeline: 320_000, conversion: 0.31 }, 'business-dna'),
    new StubSourceCollector('customers', { 'customer-satisfaction': 4.2, conversion: 0.18 }, 'business-dna'),
    new StubSourceCollector('products', { revenue: 680_000, 'marketplace-downloads': 45 }, 'marketplace'),
    new StubSourceCollector('marketplace', { 'marketplace-downloads': 120, revenue: 85_000 }, 'marketplace'),
    new StubSourceCollector('extensions', { 'marketplace-downloads': 32 }, 'marketplace'),
    new StubSourceCollector('ai-workforce', { 'worker-productivity': 0.87, 'mission-success': 0.91 }, 'ai-workforce'),
    new StubSourceCollector('ai-runtime', { 'ai-cost': 1240, 'ai-tokens': 2_450_000, 'worker-productivity': 0.85 }, 'ai-runtime'),
    new StubSourceCollector('workflow', { 'workflow-success': 0.94, 'ai-cost': 320 }, 'workflow-engine'),
    new StubSourceCollector('missions', { 'mission-success': 0.89, 'worker-productivity': 0.82 }, 'mission-scheduler'),
    new StubSourceCollector('knowledge', { 'knowledge-growth': 156, 'search-usage': 4200 }, 'knowledge-platform'),
    new StubSourceCollector('search', { 'search-usage': 8900, conversion: 0.12 }, 'search-platform'),
    new StubSourceCollector('connectors', { 'connector-health': 0.96 }, 'connectors'),
    new StubSourceCollector('infrastructure', { 'connector-health': 0.98, downtime: 15 }, 'infrastructure'),
  ];
}
