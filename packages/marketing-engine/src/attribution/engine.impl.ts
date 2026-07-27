/**
 * Real Attribution engine — deterministic first-touch, last-touch, and
 * linear attribution across a lead's recorded touchpoints.
 *
 * @module attribution/engine.impl
 */
import { generateId, nowIso } from '../shared/id.js';
import type { CampaignId, MarketingLeadId, OrganizationId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { TouchpointRepository } from './repository.js';
import type { AttributionCredit, AttributionModel, Touchpoint } from './types.js';

/** Pure, deterministic attribution — sorts touchpoints by `occurredAt` internally regardless of input order. */
export function computeAttribution(touchpoints: readonly Touchpoint[], model: AttributionModel): readonly AttributionCredit[] {
  if (touchpoints.length === 0) return [];

  const sorted = [...touchpoints].sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : a.occurredAt > b.occurredAt ? 1 : 0));

  if (model === 'first_touch') {
    return [{ campaignId: sorted[0]!.campaignId, weight: 1 }];
  }
  if (model === 'last_touch') {
    return [{ campaignId: sorted[sorted.length - 1]!.campaignId, weight: 1 }];
  }

  const weightPerTouch = 1 / sorted.length;
  const creditByCampaign = new Map<CampaignId, number>();
  for (const touchpoint of sorted) {
    creditByCampaign.set(touchpoint.campaignId, (creditByCampaign.get(touchpoint.campaignId) ?? 0) + weightPerTouch);
  }
  return [...creditByCampaign.entries()].map(([campaignId, weight]) => ({
    campaignId,
    weight: Math.round(weight * 10_000) / 10_000,
  }));
}

export interface AttributionEngine {
  recordTouchpoint(
    organizationId: OrganizationId,
    leadId: MarketingLeadId,
    campaignId: CampaignId,
    occurredAt?: ISODateTime,
  ): Promise<Touchpoint>;
  computeAttributionForLead(
    organizationId: OrganizationId,
    leadId: MarketingLeadId,
    model: AttributionModel,
  ): Promise<readonly AttributionCredit[]>;
}

/** Creates a real {@link AttributionEngine} backed by a {@link TouchpointRepository}. */
export function createAttributionEngine(repository: TouchpointRepository, now: () => string = nowIso): AttributionEngine {
  return {
    async recordTouchpoint(organizationId, leadId, campaignId, occurredAt) {
      const timestamp = now();
      const touchpoint: Touchpoint = {
        id: generateId('touchpoint'),
        organizationId,
        leadId,
        campaignId,
        occurredAt: occurredAt ?? timestamp,
        createdAt: timestamp,
      };
      await repository.save(touchpoint);
      return touchpoint;
    },

    async computeAttributionForLead(organizationId, leadId, model) {
      const touchpoints = await repository.findByLead(organizationId, leadId);
      return computeAttribution(touchpoints, model);
    },
  };
}
