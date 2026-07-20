/** @module supplier/repository */
import type { OrganizationId, SupplierId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Supplier } from './types.js';

export interface SupplierRepository extends Repository<Supplier, SupplierId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Supplier | null>;
}
