/**
 * Real Lead Scoring engine — deterministic, weighted scoring across
 * engagement, source, profile completeness, activity count, and
 * recency. No AI model.
 *
 * @module lead-scoring/engine.impl
 */
import type { MarketingEventBus } from '../events/marketing-event-bus.js';
import type { MarketingLeadRepository } from '../lead-generation/repository.js';
import type { LeadSource, MarketingLead } from '../lead-generation/types.js';
import { MarketingLeadNotFoundError } from '../shared/errors.js';
import { nowIso } from '../shared/id.js';
import type { MarketingLeadId, OrganizationId } from '../shared/identifiers.js';
import type { LeadScoringInput } from './types.js';

/** Deterministic weight assigned to each lead generation source (0-100). No AI model — a fixed lookup table. */
export const SOURCE_SCORE_WEIGHT: Readonly<Record<LeadSource, number>> = {
  referral: 100,
  inbound: 80,
  event: 70,
  outbound: 50,
  manual_import: 30,
};

const ACTIVITY_COUNT_CAP = 10;
const RECENCY_DECAY_DAYS = 90;

/** Pure: 100 at same-day activity, decaying linearly to 0 at `RECENCY_DECAY_DAYS` days. */
export function computeRecencyScore(daysSinceLastActivity: number | undefined): number {
  if (daysSinceLastActivity === undefined) return 0;
  if (daysSinceLastActivity <= 0) return 100;
  if (daysSinceLastActivity >= RECENCY_DECAY_DAYS) return 0;
  return 100 - (daysSinceLastActivity / RECENCY_DECAY_DAYS) * 100;
}

/** Pure, deterministic 0-100 lead score across engagement (30%), source (20%), profile completeness (20%), activity count (15%), and recency (15%). */
export function computeLeadScore(input: LeadScoringInput): number {
  const engagementComponent = (input.engagementScore ?? 0) * 0.3;
  const sourceComponent = SOURCE_SCORE_WEIGHT[input.source] * 0.2;
  const profileComponent = (input.profileCompletenessPct ?? 0) * 0.2;
  const activityComponent = Math.min(input.activityCount ?? 0, ACTIVITY_COUNT_CAP) * (100 / ACTIVITY_COUNT_CAP) * 0.15;
  const recencyComponent = computeRecencyScore(input.daysSinceLastActivity) * 0.15;

  const total = engagementComponent + sourceComponent + profileComponent + activityComponent + recencyComponent;
  return Math.round(Math.min(100, Math.max(0, total)) * 100) / 100;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  return Math.max(0, (to - from) / (1000 * 60 * 60 * 24));
}

export interface LeadScoringEngine {
  /** Recomputes and persists the given lead's deterministic score. */
  scoreLead(organizationId: OrganizationId, leadId: MarketingLeadId): Promise<MarketingLead>;
}

/** Creates a real {@link LeadScoringEngine} over the Marketing Lead repository. */
export function createLeadScoringEngine(
  repository: MarketingLeadRepository,
  eventBus?: MarketingEventBus,
  now: () => string = nowIso,
): LeadScoringEngine {
  return {
    async scoreLead(organizationId, leadId) {
      const lead = await repository.findById(organizationId, leadId);
      if (!lead) throw new MarketingLeadNotFoundError(leadId);

      const daysSinceLastActivity = lead.lastActivityAt ? daysBetween(lead.lastActivityAt, now()) : undefined;
      const score = computeLeadScore({
        engagementScore: lead.engagementScore,
        source: lead.source,
        profileCompletenessPct: lead.profileCompletenessPct,
        activityCount: lead.activityCount,
        daysSinceLastActivity,
      });

      const updated: MarketingLead = { ...lead, score, updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('lead.scored', { leadId, organizationId, score });
      return updated;
    },
  };
}
