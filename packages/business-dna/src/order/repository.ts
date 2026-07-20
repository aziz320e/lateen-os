/** @module order/repository */
import type { CustomerId, OrganizationId, OrderId, ProjectId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { DocumentNumber } from '../shared/primitives.js';
import type { Order, OrderStatus } from './types.js';

export interface OrderRepository extends Repository<Order, OrderId> {
  findByNumber(organizationId: OrganizationId, number: DocumentNumber): Promise<Order | null>;
  findByCustomer(organizationId: OrganizationId, customerId: CustomerId): Promise<readonly Order[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly Order[]>;
  findByStatus(organizationId: OrganizationId, status: OrderStatus): Promise<readonly Order[]>;
}
