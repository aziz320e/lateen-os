/** @module attribution/types */
import type { CampaignId, MarketingLeadId, TouchpointId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { TouchpointId };

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear';

/** A single recorded marketing touch — a lead's exposure to a campaign at a point in time. */
export interface Touchpoint {
  readonly id: TouchpointId;
  readonly organizationId: string;
  readonly leadId: MarketingLeadId;
  readonly campaignId: CampaignId;
  readonly occurredAt: ISODateTime;
  readonly createdAt: ISODateTime;
}

/** The share of attribution credit a campaign earns for a lead's conversion. */
export interface AttributionCredit {
  readonly campaignId: CampaignId;
  /** 0-1; every credit for one lead sums to 1. */
  readonly weight: number;
}
