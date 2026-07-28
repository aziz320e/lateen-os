import { describe, expect, it } from 'vitest';
import { createCustomerSuccessEventBus } from '../src/events/index.js';
import { computeAverageCsat, computeNpsCategory, computeNpsScore, createFeedbackEngine } from '../src/feedback/engine.impl.js';
import { createFeedbackEntryRepository } from '../src/feedback/repository.impl.js';
import type { FeedbackEntry } from '../src/feedback/types.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createCustomerSuccessEventBus();
  const engine = createFeedbackEngine(createFeedbackEntryRepository(), eventBus);
  return { engine, eventBus };
}

function makeNpsEntry(score: number): FeedbackEntry {
  return {
    id: 'entry-x',
    organizationId: ORG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    customerId: 'customer-1',
    feedbackType: 'nps',
    score,
  };
}

describe('computeNpsCategory (pure)', () => {
  it('categorizes 9-10 as promoter', () => {
    expect(computeNpsCategory(9)).toBe('promoter');
    expect(computeNpsCategory(10)).toBe('promoter');
  });

  it('categorizes 7-8 as passive', () => {
    expect(computeNpsCategory(7)).toBe('passive');
    expect(computeNpsCategory(8)).toBe('passive');
  });

  it('categorizes 0-6 as detractor', () => {
    expect(computeNpsCategory(0)).toBe('detractor');
    expect(computeNpsCategory(6)).toBe('detractor');
  });
});

describe('computeNpsScore (pure)', () => {
  it('computes the standard %promoters - %detractors formula', () => {
    const entries = [makeNpsEntry(10), makeNpsEntry(9), makeNpsEntry(3), makeNpsEntry(8)];
    // 2 promoters, 1 detractor, 1 passive, out of 4 => (2-1)/4*100 = 25
    expect(computeNpsScore(entries)).toBe(25);
  });

  it('returns 0 for an empty list', () => {
    expect(computeNpsScore([])).toBe(0);
  });

  it('returns 100 when every respondent is a promoter', () => {
    expect(computeNpsScore([makeNpsEntry(10), makeNpsEntry(9)])).toBe(100);
  });

  it('returns -100 when every respondent is a detractor', () => {
    expect(computeNpsScore([makeNpsEntry(0), makeNpsEntry(5)])).toBe(-100);
  });

  it('ignores non-nps entries and entries without a score', () => {
    const entries: FeedbackEntry[] = [
      makeNpsEntry(10),
      { ...makeNpsEntry(5), feedbackType: 'csat' },
      { ...makeNpsEntry(0), score: undefined },
    ];
    expect(computeNpsScore(entries)).toBe(100);
  });
});

describe('computeAverageCsat (pure)', () => {
  it('averages csat scores', () => {
    const entries: FeedbackEntry[] = [
      { ...makeNpsEntry(4), feedbackType: 'csat' },
      { ...makeNpsEntry(5), feedbackType: 'csat' },
    ];
    expect(computeAverageCsat(entries)).toBe(4.5);
  });

  it('returns 0 for an empty list', () => {
    expect(computeAverageCsat([])).toBe(0);
  });
});

describe('FeedbackEngine', () => {
  it('recordFeedback() persists an nps entry and publishes feedback.received', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('feedback.received', (payload) => (seen = payload));
    const entry = await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    expect(entry.feedbackType).toBe('nps');
    expect(seen).toEqual({ organizationId: ORG, feedbackEntryId: entry.id, customerId: 'customer-1', feedbackType: 'nps' });
  });

  it('recordFeedback() supports a named survey entry with a comment', async () => {
    const { engine } = setup();
    const entry = await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'survey', surveyName: 'Onboarding Survey', comment: 'Great experience' });
    expect(entry.surveyName).toBe('Onboarding Survey');
    expect(entry.comment).toBe('Great experience');
  });

  it('computeNpsForCustomer() aggregates only that customer’s nps entries', async () => {
    const { engine } = setup();
    await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 10 });
    await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    await engine.recordFeedback(ORG, { customerId: 'customer-2', feedbackType: 'nps', score: 0 });
    expect(await engine.computeNpsForCustomer(ORG, 'customer-1')).toBe(100);
  });

  it('computeCsatForCustomer() aggregates only that customer’s csat entries', async () => {
    const { engine } = setup();
    await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'csat', score: 4 });
    await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'csat', score: 5 });
    expect(await engine.computeCsatForCustomer(ORG, 'customer-1')).toBe(4.5);
  });

  it('getHistory() returns entries in chronological order', async () => {
    const { engine } = setup();
    let tick = 0;
    const fixedNow = () => `2026-01-0${(tick += 1)}T00:00:00.000Z`;
    const orderedEngine = createFeedbackEngine(createFeedbackEntryRepository(), undefined, fixedNow);
    await orderedEngine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 8 });
    await orderedEngine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'csat', score: 5 });
    const history = await orderedEngine.getHistory(ORG, 'customer-1');
    expect(history.map((entry) => entry.feedbackType)).toEqual(['nps', 'csat']);
  });

  it('findByCustomer / findByType filter correctly', async () => {
    const { engine } = setup();
    const entry = await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    await engine.recordFeedback(ORG, { customerId: 'customer-2', feedbackType: 'csat', score: 5 });
    expect(await engine.findByCustomer(ORG, 'customer-1')).toEqual([entry]);
    expect(await engine.findByType(ORG, 'nps')).toEqual([entry]);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const entry = await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    expect(await engine.get(ORG, entry.id)).toEqual(entry);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('feedback entries are isolated per organization', async () => {
    const { engine } = setup();
    await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    await engine.recordFeedback('org-2', { customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('computeNpsForCustomer() returns 0 when a customer has no nps entries', async () => {
    const { engine } = setup();
    expect(await engine.computeNpsForCustomer(ORG, 'unknown-customer')).toBe(0);
  });

  it('computeCsatForCustomer() returns 0 when a customer has no csat entries', async () => {
    const { engine } = setup();
    expect(await engine.computeCsatForCustomer(ORG, 'unknown-customer')).toBe(0);
  });

  it('recordFeedback() without a score leaves it undefined (e.g. a comment-only survey)', async () => {
    const { engine } = setup();
    const entry = await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'survey', comment: 'Loved the onboarding' });
    expect(entry.score).toBeUndefined();
  });

  it('getHistory() returns an empty array for a customer with no feedback', async () => {
    const { engine } = setup();
    expect(await engine.getHistory(ORG, 'unknown-customer')).toEqual([]);
  });

  it('list() returns an empty array for an organization with no feedback', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('findByType() returns an empty array when no entry matches', async () => {
    const { engine } = setup();
    await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    expect(await engine.findByType(ORG, 'survey')).toEqual([]);
  });

  it('feedback entries are isolated per organization', async () => {
    const { engine } = setup();
    await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    await engine.recordFeedback('org-2', { customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('computeNpsScore treats a passive-only group as a 0 NPS', () => {
    expect(computeNpsScore([makeNpsEntry(7), makeNpsEntry(8)])).toBe(0);
  });

  it('computeNpsCategory correctly classifies every boundary value 0 through 10', () => {
    expect(computeNpsCategory(0)).toBe('detractor');
    expect(computeNpsCategory(6)).toBe('detractor');
    expect(computeNpsCategory(7)).toBe('passive');
    expect(computeNpsCategory(8)).toBe('passive');
    expect(computeNpsCategory(9)).toBe('promoter');
    expect(computeNpsCategory(10)).toBe('promoter');
  });

  it('computeAverageCsat rounds to 2 decimal places', () => {
    const entries: FeedbackEntry[] = [
      { ...makeNpsEntry(4), feedbackType: 'csat' },
      { ...makeNpsEntry(4), feedbackType: 'csat' },
      { ...makeNpsEntry(5), feedbackType: 'csat' },
    ];
    expect(computeAverageCsat(entries)).toBe(4.33);
  });

  it('a customer can accumulate nps, csat, and survey feedback independently', async () => {
    const { engine } = setup();
    await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'csat', score: 5 });
    await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'survey', surveyName: 'Onboarding' });
    expect(await engine.findByCustomer(ORG, 'customer-1')).toHaveLength(3);
  });

  it('recordFeedback() for one customer does not affect another customer’s NPS', async () => {
    const { engine } = setup();
    await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 10 });
    await engine.recordFeedback(ORG, { customerId: 'customer-2', feedbackType: 'nps', score: 0 });
    expect(await engine.computeNpsForCustomer(ORG, 'customer-1')).toBe(100);
    expect(await engine.computeNpsForCustomer(ORG, 'customer-2')).toBe(-100);
  });

  it('get() returns null for a feedback entry belonging to a different organization', async () => {
    const { engine } = setup();
    const entry = await engine.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    expect(await engine.get('org-2', entry.id)).toBeNull();
  });

  it('computeNpsScore is exactly 0 for a perfectly balanced group', () => {
    expect(computeNpsScore([makeNpsEntry(10), makeNpsEntry(0)])).toBe(0);
  });
});
