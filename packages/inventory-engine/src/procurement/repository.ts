/** @module procurement/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, PurchaseRequestId } from '../shared/identifiers.js';
import type { PurchaseRequest, PurchaseRequestStatus } from './types.js';

export interface PurchaseRequestRepository extends Repository<PurchaseRequest, PurchaseRequestId> {
  findAll(organizationId: OrganizationId): Promise<readonly PurchaseRequest[]>;
  findByStatus(organizationId: OrganizationId, status: PurchaseRequestStatus): Promise<readonly PurchaseRequest[]>;
}
