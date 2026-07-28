/** @module payroll/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, PayrollRunId } from '../shared/identifiers.js';
import type { PayrollRun, PayrollRunStatus } from './types.js';

export interface PayrollRunRepository extends Repository<PayrollRun, PayrollRunId> {
  findAll(organizationId: OrganizationId): Promise<readonly PayrollRun[]>;
  findByStatus(organizationId: OrganizationId, status: PayrollRunStatus): Promise<readonly PayrollRun[]>;
}
