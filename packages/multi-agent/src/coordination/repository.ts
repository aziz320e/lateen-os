/** @module coordination/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type {
  CoordinationPlan,
  CoordinationPlanId,
  CoordinationPolicy,
  CoordinationPolicyId,
  CoordinationStep,
  CoordinationStepId,
  Coordinator,
  CoordinatorId,
} from './types.js';

export interface CoordinatorRepository extends Repository<Coordinator, CoordinatorId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<Coordinator | null>;
}
export interface CoordinationPlanRepository extends Repository<CoordinationPlan, CoordinationPlanId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<CoordinationPlan | null>;
}
export interface CoordinationStepRepository extends Repository<CoordinationStep, CoordinationStepId> {
  findByPlan(organizationId: OrganizationId, planId: CoordinationPlanId): Promise<readonly CoordinationStep[]>;
}
export interface CoordinationPolicyRepository extends Repository<CoordinationPolicy, CoordinationPolicyId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<CoordinationPolicy | null>;
}
