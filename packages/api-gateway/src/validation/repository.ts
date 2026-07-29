/** @module validation/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, ValidationSchemaId } from '../shared/identifiers.js';
import type { ValidationSchema } from './types.js';

export interface ValidationSchemaRepository extends Repository<ValidationSchema, ValidationSchemaId> {
  findAll(organizationId: OrganizationId): Promise<readonly ValidationSchema[]>;
}
