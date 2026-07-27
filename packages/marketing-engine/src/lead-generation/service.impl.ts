/**
 * Real Lead Generation — captures leads from inbound, outbound, referral,
 * event, and manual-import channels.
 *
 * @module lead-generation/service.impl
 */
import type { MarketingEventBus } from '../events/marketing-event-bus.js';
import { MarketingLeadNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CampaignId, MarketingLeadId, OrganizationId } from '../shared/identifiers.js';
import type { ISODateTime, MarketingTag } from '../shared/primitives.js';
import type { MarketingLeadRepository } from './repository.js';
import type { LeadSource, MarketingLead } from './types.js';

export interface GenerateLeadInput {
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly company?: string;
  readonly source: LeadSource;
  readonly campaignId?: CampaignId;
  readonly engagementScore?: number;
  readonly profileCompletenessPct?: number;
  readonly activityCount?: number;
  readonly lastActivityAt?: ISODateTime;
  readonly tags?: readonly MarketingTag[];
}

export interface LeadGenerationService {
  generateLead(organizationId: OrganizationId, input: GenerateLeadInput): Promise<MarketingLead>;
  archiveLead(organizationId: OrganizationId, leadId: MarketingLeadId): Promise<MarketingLead>;
  get(organizationId: OrganizationId, leadId: MarketingLeadId): Promise<MarketingLead | null>;
  listByCampaign(organizationId: OrganizationId, campaignId: CampaignId): Promise<readonly MarketingLead[]>;
}

/** Creates a real {@link LeadGenerationService} backed by a {@link MarketingLeadRepository}. */
export function createLeadGenerationService(
  repository: MarketingLeadRepository,
  eventBus?: MarketingEventBus,
  now: () => string = nowIso,
): LeadGenerationService {
  return {
    async generateLead(organizationId, input) {
      const timestamp = now();
      const lead: MarketingLead = {
        id: generateId('marketing-lead'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        source: input.source,
        campaignId: input.campaignId,
        status: 'new',
        engagementScore: input.engagementScore,
        profileCompletenessPct: input.profileCompletenessPct,
        activityCount: input.activityCount,
        lastActivityAt: input.lastActivityAt,
        tags: input.tags ?? [],
      };
      await repository.save(lead);
      eventBus?.publish('lead.generated', { leadId: lead.id, organizationId, source: lead.source });
      return lead;
    },

    async archiveLead(organizationId, leadId) {
      const lead = await repository.findById(organizationId, leadId);
      if (!lead) throw new MarketingLeadNotFoundError(leadId);
      const updated: MarketingLead = { ...lead, status: 'archived', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, leadId) {
      return repository.findById(organizationId, leadId);
    },

    async listByCampaign(organizationId, campaignId) {
      return repository.findByCampaign(organizationId, campaignId);
    },
  };
}
