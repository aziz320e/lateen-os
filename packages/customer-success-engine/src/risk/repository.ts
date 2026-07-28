/** @module risk/repository */
import type { Repository } from '../shared/repository.js';
import type { CustomerRiskId, OrganizationId } from '../shared/identifiers.js';
import type { CustomerRisk, CustomerRiskStatus } from './types.js';

export interface CustomerRiskRepository extends Repository<CustomerRisk, CustomerRiskId> {
  findAll(organizationId: OrganizationId): Promise<readonly CustomerRisk[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<readonly CustomerRisk[]>;
  findByStatus(organizationId: OrganizationId, status: CustomerRiskStatus): Promise<readonly CustomerRisk[]>;
}
