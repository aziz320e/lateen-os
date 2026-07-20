/** @module forecasting/repository */
import type { ForecastId, OrganizationId, ProductId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Forecast, ForecastPeriod } from './types.js';

export interface ForecastRepository extends Repository<Forecast, ForecastId> {
  findByProduct(
    organizationId: OrganizationId,
    productId: ProductId,
  ): Promise<readonly Forecast[]>;
  findByPeriod(
    organizationId: OrganizationId,
    period: ForecastPeriod,
  ): Promise<readonly Forecast[]>;
}
