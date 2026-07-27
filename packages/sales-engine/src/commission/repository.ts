/** @module commission/repository */
import type { Repository } from '../shared/repository.js';
import type { CommissionPlanId, OrganizationId } from '../shared/identifiers.js';
import type { CommissionPlan, CommissionPlanStatus } from './types.js';

export interface CommissionPlanRepository extends Repository<CommissionPlan, CommissionPlanId> {
  findAll(organizationId: OrganizationId): Promise<readonly CommissionPlan[]>;
  findByStatus(organizationId: OrganizationId, status: CommissionPlanStatus): Promise<readonly CommissionPlan[]>;
}
