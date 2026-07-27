/** @module attribution/repository */
import type { MarketingLeadId, OrganizationId, TouchpointId } from '../shared/identifiers.js';
import type { Touchpoint } from './types.js';

export interface TouchpointRepository {
  save(touchpoint: Touchpoint): Promise<void>;
  findById(organizationId: OrganizationId, touchpointId: TouchpointId): Promise<Touchpoint | null>;
  /** Every touchpoint for a lead, ordered oldest first. */
  findByLead(organizationId: OrganizationId, leadId: MarketingLeadId): Promise<readonly Touchpoint[]>;
}
