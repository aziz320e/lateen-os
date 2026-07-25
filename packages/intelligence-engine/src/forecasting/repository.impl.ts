/** Real in-memory {@link ForecastRepository} implementation. @module forecasting/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ForecastId } from '../shared/identifiers.js';
import type { Forecast } from './types.js';
import type { ForecastRepository } from './repository.js';

export function createForecastRepository(seed?: readonly Forecast[]): ForecastRepository {
  const repo = createInMemoryRepository<Forecast, ForecastId>({ seed });
  return {
    ...repo,
    async findByProduct(organizationId, productId) {
      return repo.list(organizationId).filter((forecast) => forecast.productId === productId);
    },
    async findByPeriod(organizationId, period) {
      return repo.list(organizationId).filter((forecast) => forecast.period === period);
    },
  };
}
