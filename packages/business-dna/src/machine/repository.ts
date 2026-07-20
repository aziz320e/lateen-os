/** @module machine/repository */
import type { BranchId, MachineId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Machine, MachineStatus } from './types.js';

export interface MachineRepository extends Repository<Machine, MachineId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Machine | null>;
  findByBranch(organizationId: OrganizationId, branchId: BranchId): Promise<readonly Machine[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: MachineStatus,
  ): Promise<readonly Machine[]>;
}
