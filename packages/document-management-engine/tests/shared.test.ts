import { describe, expect, it } from 'vitest';
import { addDaysIso, daysBetweenIso } from '../src/shared/date.js';
import { generateId, nowIso } from '../src/shared/id.js';

describe('shared/date', () => {
  it('daysBetweenIso is positive when `to` is after `from`', () => {
    expect(daysBetweenIso('2026-01-01', '2026-01-31')).toBe(30);
  });

  it('daysBetweenIso is negative when `to` precedes `from`', () => {
    expect(daysBetweenIso('2026-01-31', '2026-01-01')).toBe(-30);
  });

  it('daysBetweenIso is 0 for the same date', () => {
    expect(daysBetweenIso('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('daysBetweenIso handles a full calendar year span', () => {
    expect(daysBetweenIso('2026-01-01', '2027-01-01')).toBe(365);
  });

  it('daysBetweenIso handles a leap-year February', () => {
    expect(daysBetweenIso('2028-02-01', '2028-03-01')).toBe(29);
  });

  it('addDaysIso adds a whole number of days', () => {
    expect(addDaysIso('2026-01-01', 10)).toBe('2026-01-11');
  });

  it('addDaysIso handles negative days', () => {
    expect(addDaysIso('2026-01-11', -10)).toBe('2026-01-01');
  });

  it('addDaysIso handles zero days', () => {
    expect(addDaysIso('2026-01-01', 0)).toBe('2026-01-01');
  });

  it('addDaysIso crosses a month boundary', () => {
    expect(addDaysIso('2026-01-25', 10)).toBe('2026-02-04');
  });
});

describe('shared/date — additional edge cases', () => {
  it('addDaysIso handles a year boundary crossing', () => {
    expect(addDaysIso('2026-12-25', 10)).toBe('2027-01-04');
  });

  it('daysBetweenIso handles a multi-month span', () => {
    expect(daysBetweenIso('2026-01-01', '2026-06-01')).toBe(151);
  });

  it('addDaysIso handles a large number of days', () => {
    expect(addDaysIso('2026-01-01', 100)).toBe('2026-04-11');
  });

  it('daysBetweenIso is symmetric in magnitude when arguments are swapped', () => {
    expect(daysBetweenIso('2026-01-01', '2026-02-01')).toBe(-daysBetweenIso('2026-02-01', '2026-01-01'));
  });
});

describe('shared/id', () => {
  it('generateId includes the given prefix', () => {
    expect(generateId('document')).toMatch(/^document-/);
  });

  it('generateId produces unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('x')));
    expect(ids.size).toBe(50);
  });

  it('nowIso returns a valid ISO timestamp', () => {
    expect(() => new Date(nowIso()).toISOString()).not.toThrow();
  });
});
