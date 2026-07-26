/** @module step/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, WorkflowInstanceId } from '../shared/identifiers.js';
import type { StepInstance, StepInstanceId } from './types.js';

export interface StepInstanceRepository extends Repository<StepInstance, StepInstanceId> {
  findByInstanceId(organizationId: OrganizationId, instanceId: WorkflowInstanceId): Promise<readonly StepInstance[]>;
  findByStatus(organizationId: OrganizationId, status: StepInstance['status']): Promise<readonly StepInstance[]>;
}
