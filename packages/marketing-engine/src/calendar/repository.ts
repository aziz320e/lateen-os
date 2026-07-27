/** @module calendar/repository */
import type { Repository } from '../shared/repository.js';
import type { CalendarEntryId, CampaignId, OrganizationId } from '../shared/identifiers.js';
import type { CalendarEntry } from './types.js';

export interface CalendarRepository extends Repository<CalendarEntry, CalendarEntryId> {
  findAll(organizationId: OrganizationId): Promise<readonly CalendarEntry[]>;
  findByCampaign(organizationId: OrganizationId, campaignId: CampaignId): Promise<readonly CalendarEntry[]>;
}
