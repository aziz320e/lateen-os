/** @module kpi/repository */
import type { KpiId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Kpi } from './types.js';

export interface KpiRepository extends Repository<Kpi, KpiId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Kpi | null>;
}
