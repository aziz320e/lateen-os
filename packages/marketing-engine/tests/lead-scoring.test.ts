import { describe, expect, it, vi } from 'vitest';
import { createMarketingLeadRepository } from '../src/lead-generation/repository.impl.js';
import { createLeadGenerationService } from '../src/lead-generation/service.impl.js';
import { computeLeadScore, computeRecencyScore, createLeadScoringEngine, SOURCE_SCORE_WEIGHT } from '../src/lead-scoring/engine.impl.js';
import { createMarketingEventBus } from '../src/events/marketing-event-bus.js';
import { MarketingLeadNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('SOURCE_SCORE_WEIGHT', () => {
  it('ranks referral highest and manual_import lowest', () => {
    expect(SOURCE_SCORE_WEIGHT.referral).toBeGreaterThan(SOURCE_SCORE_WEIGHT.inbound);
    expect(SOURCE_SCORE_WEIGHT.inbound).toBeGreaterThan(SOURCE_SCORE_WEIGHT.event);
    expect(SOURCE_SCORE_WEIGHT.event).toBeGreaterThan(SOURCE_SCORE_WEIGHT.outbound);
    expect(SOURCE_SCORE_WEIGHT.outbound).toBeGreaterThan(SOURCE_SCORE_WEIGHT.manual_import);
  });
});

describe('computeRecencyScore (pure)', () => {
  it('returns 100 for same-day activity', () => {
    expect(computeRecencyScore(0)).toBe(100);
  });

  it('returns 0 for undefined or fully decayed activity', () => {
    expect(computeRecencyScore(undefined)).toBe(0);
    expect(computeRecencyScore(90)).toBe(0);
    expect(computeRecencyScore(200)).toBe(0);
  });

  it('decays linearly between 0 and 90 days', () => {
    expect(computeRecencyScore(45)).toBeCloseTo(50, 0);
  });
});

describe('computeLeadScore (pure)', () => {
  it('returns 0 for a lead with no factors at all beyond source', () => {
    const score = computeLeadScore({ source: 'manual_import' });
    expect(score).toBeCloseTo(SOURCE_SCORE_WEIGHT.manual_import * 0.2, 2);
  });

  it('returns 100 for a maximally-engaged, same-day, complete, referral lead', () => {
    const score = computeLeadScore({
      engagementScore: 100,
      source: 'referral',
      profileCompletenessPct: 100,
      activityCount: 20,
      daysSinceLastActivity: 0,
    });
    expect(score).toBe(100);
  });

  it('caps the activity-count component at 10 activities', () => {
    const withTen = computeLeadScore({ source: 'inbound', activityCount: 10 });
    const withTwenty = computeLeadScore({ source: 'inbound', activityCount: 20 });
    expect(withTen).toBe(withTwenty);
  });

  it('weights engagement more heavily than profile completeness', () => {
    const engagementOnly = computeLeadScore({ source: 'inbound', engagementScore: 100 });
    const profileOnly = computeLeadScore({ source: 'inbound', profileCompletenessPct: 100 });
    expect(engagementOnly).toBeGreaterThan(profileOnly);
  });
});

function setup(eventBus = createMarketingEventBus()) {
  const repository = createMarketingLeadRepository();
  const leadGeneration = createLeadGenerationService(repository, eventBus);
  const scoring = createLeadScoringEngine(repository, eventBus);
  return { repository, leadGeneration, scoring, eventBus };
}

describe('createLeadScoringEngine', () => {
  it('scoreLead() computes and persists a score', async () => {
    const { leadGeneration, scoring } = setup();
    const lead = await leadGeneration.generateLead(ORG, {
      name: 'Jordan Lee',
      source: 'referral',
      engagementScore: 80,
      profileCompletenessPct: 90,
      activityCount: 5,
      lastActivityAt: new Date().toISOString(),
    });
    const scored = await scoring.scoreLead(ORG, lead.id);
    expect(scored.score).toBeGreaterThan(0);
    expect(scored.score).toBeLessThanOrEqual(100);
  });

  it('scoreLead() treats a lead with no lastActivityAt as having zero recency credit', async () => {
    const { leadGeneration, scoring } = setup();
    const lead = await leadGeneration.generateLead(ORG, { name: 'Jordan Lee', source: 'inbound' });
    const scored = await scoring.scoreLead(ORG, lead.id);
    expect(scored.score).toBeCloseTo(SOURCE_SCORE_WEIGHT.inbound * 0.2, 2);
  });

  it('throws MarketingLeadNotFoundError for an unknown lead', async () => {
    const { scoring } = setup();
    await expect(scoring.scoreLead(ORG, 'missing')).rejects.toBeInstanceOf(MarketingLeadNotFoundError);
  });

  it('publishes lead.scored', async () => {
    const eventBus = createMarketingEventBus();
    const scored = vi.fn();
    eventBus.subscribe('lead.scored', scored);
    const { leadGeneration, scoring } = setup(eventBus);
    const lead = await leadGeneration.generateLead(ORG, { name: 'Jordan Lee', source: 'inbound' });
    await scoring.scoreLead(ORG, lead.id);
    await Promise.resolve();
    expect(scored).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { leadGeneration, scoring } = setup();
    const lead = await leadGeneration.generateLead(ORG, { name: 'Jordan Lee', source: 'inbound' });
    await expect(scoring.scoreLead('org-2', lead.id)).rejects.toBeInstanceOf(MarketingLeadNotFoundError);
  });
});
