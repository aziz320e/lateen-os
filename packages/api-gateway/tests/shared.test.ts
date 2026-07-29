import { describe, expect, it } from 'vitest';
import { addDaysIso, addSecondsIso, daysBetweenIso, secondsBetweenIso } from '../src/shared/date.js';
import { generateId, nowIso } from '../src/shared/id.js';

describe('shared/date', () => {
  it('daysBetweenIso is positive when `to` is after `from`', () => {
    expect(daysBetweenIso('2026-01-01', '2026-01-31')).toBe(30);
  });

  it('daysBetweenIso is negative when `to` precedes `from`', () => {
    expect(daysBetweenIso('2026-01-31', '2026-01-01')).toBe(-30);
  });

  it('addDaysIso adds a whole number of days', () => {
    expect(addDaysIso('2026-01-01', 10)).toBe('2026-01-11');
  });

  it('secondsBetweenIso computes elapsed seconds', () => {
    expect(secondsBetweenIso('2026-01-01T00:00:00.000Z', '2026-01-01T00:01:00.000Z')).toBe(60);
  });

  it('secondsBetweenIso is negative when `to` precedes `from`', () => {
    expect(secondsBetweenIso('2026-01-01T00:01:00.000Z', '2026-01-01T00:00:00.000Z')).toBe(-60);
  });

  it('secondsBetweenIso is 0 for the same instant', () => {
    expect(secondsBetweenIso('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toBe(0);
  });

  it('addSecondsIso adds a whole number of seconds', () => {
    expect(addSecondsIso('2026-01-01T00:00:00.000Z', 90)).toBe('2026-01-01T00:01:30.000Z');
  });

  it('addSecondsIso handles negative seconds', () => {
    expect(addSecondsIso('2026-01-01T00:01:30.000Z', -90)).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('shared/id', () => {
  it('generateId includes the given prefix', () => {
    expect(generateId('gateway-api')).toMatch(/^gateway-api-/);
  });

  it('generateId produces unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('x')));
    expect(ids.size).toBe(50);
  });

  it('nowIso returns a valid ISO timestamp', () => {
    expect(() => new Date(nowIso()).toISOString()).not.toThrow();
  });

  it('generateId produces different ids for different prefixes', () => {
    expect(generateId('gateway-api')).not.toBe(generateId('gateway-route'));
  });
});

describe('shared/date — additional coverage', () => {
  it('daysBetweenIso is 0 for the same day', () => {
    expect(daysBetweenIso('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('addDaysIso handles negative day counts', () => {
    expect(addDaysIso('2026-01-11', -10)).toBe('2026-01-01');
  });

  it('addSecondsIso with 0 seconds returns the same instant', () => {
    expect(addSecondsIso('2026-01-01T00:00:00.000Z', 0)).toBe('2026-01-01T00:00:00.000Z');
  });

  it('secondsBetweenIso spans across a day boundary correctly', () => {
    expect(secondsBetweenIso('2026-01-01T23:59:00.000Z', '2026-01-02T00:01:00.000Z')).toBe(120);
  });
});
