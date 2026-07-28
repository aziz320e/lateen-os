/** @module position/repository */
import type { DepartmentId } from '../department/types.js';
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, PositionId } from '../shared/identifiers.js';
import type { Position, PositionStatus } from './types.js';

export interface PositionRepository extends Repository<Position, PositionId> {
  findAll(organizationId: OrganizationId): Promise<readonly Position[]>;
  findByDepartment(organizationId: OrganizationId, departmentId: DepartmentId): Promise<readonly Position[]>;
  findByStatus(organizationId: OrganizationId, status: PositionStatus): Promise<readonly Position[]>;
}
