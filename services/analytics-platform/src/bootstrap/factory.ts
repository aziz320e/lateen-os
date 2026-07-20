import { AnalyticsService } from '../application/analytics.service';
import { InMemorySourceCollectorRegistry } from '../collectors/source-collector';
import { createDefaultCollectors } from '../collectors/stub-collectors';
import { InMemoryAnalyticsRepository } from '../repositories/in-memory-repository';

export function createAnalyticsService(): AnalyticsService {
  const registry = new InMemorySourceCollectorRegistry();
  for (const collector of createDefaultCollectors()) {
    registry.register(collector);
  }
  return new AnalyticsService(registry, new InMemoryAnalyticsRepository());
}
