/** @module forecast/repository */
import type { OrganizationId } from '../shared/identifiers.js';
import type { ForecastSnapshot } from './types.js';

export interface ForecastSnapshotRepository {
  save(snapshot: ForecastSnapshot): Promise<void>;
  /** Every snapshot for an organization, most recently generated first. */
  findAll(organizationId: OrganizationId): Promise<readonly ForecastSnapshot[]>;
  findLatest(organizationId: OrganizationId): Promise<ForecastSnapshot | null>;
}
