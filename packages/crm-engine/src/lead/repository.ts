/** @module lead/repository */
import type { Repository } from '../shared/repository.js';
import type { LeadId, OrganizationId } from '../shared/identifiers.js';
import type { Email, Phone } from '../shared/primitives.js';
import type { Lead, LeadStatus } from './types.js';

export interface LeadRepository extends Repository<Lead, LeadId> {
  findAll(organizationId: OrganizationId): Promise<readonly Lead[]>;
  findByStatus(organizationId: OrganizationId, status: LeadStatus): Promise<readonly Lead[]>;
  findByEmail(organizationId: OrganizationId, email: Email): Promise<Lead | null>;
  findByPhone(organizationId: OrganizationId, phone: Phone): Promise<Lead | null>;
}
