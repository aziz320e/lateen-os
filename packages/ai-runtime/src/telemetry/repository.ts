/** @module telemetry/repository */
import type { OrganizationId, TelemetryEventId, TraceId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { TelemetryEvent, Trace } from './types.js';

export interface TelemetryEventRepository extends Repository<TelemetryEvent, TelemetryEventId> {}

export interface TraceRepository extends Repository<Trace, TraceId> {
  findByOrganization(organizationId: OrganizationId): Promise<readonly Trace[]>;
}
