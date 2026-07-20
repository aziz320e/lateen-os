/** @module monitoring/repository */
import type { OrganizationId } from '../shared/identifiers.js';
import type { RuntimeMetrics } from './types.js';

export interface RuntimeMetricsRepository {
  getLatest(organizationId: OrganizationId): Promise<RuntimeMetrics | null>;
}
