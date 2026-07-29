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

  it('daysBetweenIso is 0 for the same day', () => {
    expect(daysBetweenIso('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('addDaysIso adds a whole number of days', () => {
    expect(addDaysIso('2026-01-01', 10)).toBe('2026-01-11');
  });

  it('addDaysIso handles negative day counts', () => {
    expect(addDaysIso('2026-01-11', -10)).toBe('2026-01-01');
  });
});

describe('shared/id', () => {
  it('generateId includes the given prefix', () => {
    expect(generateId('admin-org')).toMatch(/^admin-org-/);
  });

  it('generateId produces unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('x')));
    expect(ids.size).toBe(50);
  });

  it('generateId produces different ids for different prefixes', () => {
    expect(generateId('admin-org')).not.toBe(generateId('admin-tenant'));
  });

  it('nowIso returns a valid ISO timestamp', () => {
    expect(() => new Date(nowIso()).toISOString()).not.toThrow();
  });

  it('generateId ids always contain exactly two hyphen-separated suffix segments after the prefix', () => {
    const id = generateId('admin-tenant');
    const withoutPrefix = id.slice('admin-tenant-'.length);
    expect(withoutPrefix.split('-')).toHaveLength(2);
  });

  it('nowIso values are monotonically non-decreasing across immediate successive calls', () => {
    const first = nowIso();
    const second = nowIso();
    expect(new Date(second).getTime()).toBeGreaterThanOrEqual(new Date(first).getTime());
  });
});

describe('shared/date — additional coverage', () => {
  it('addDaysIso with 0 days returns the same date', () => {
    expect(addDaysIso('2026-03-15', 0)).toBe('2026-03-15');
  });

  it('daysBetweenIso spans a leap-year February correctly', () => {
    expect(daysBetweenIso('2028-02-01', '2028-03-01')).toBe(29);
  });

  it('addDaysIso crosses a year boundary correctly', () => {
    expect(addDaysIso('2026-12-25', 10)).toBe('2027-01-04');
  });

  it('daysBetweenIso across a non-leap-year February', () => {
    expect(daysBetweenIso('2026-02-01', '2026-03-01')).toBe(28);
  });

  it('generateId prefix survives round-tripping through string operations', () => {
    const id = generateId('admin-role');
    expect(id.startsWith('admin-role-')).toBe(true);
  });

  it('generateId called rapidly in a tight loop still produces unique ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateId('stress')));
    expect(ids.size).toBe(200);
  });

  it('addDaysIso and daysBetweenIso are mutually consistent', () => {
    const start = '2026-05-01';
    const end = addDaysIso(start, 17);
    expect(daysBetweenIso(start, end)).toBe(17);
  });

  it('generateId accepts an empty-string prefix without throwing', () => {
    expect(() => generateId('')).not.toThrow();
  });

  it('nowIso never returns a value in the past relative to Date.now() at call time', () => {
    const before = Date.now();
    const timestamp = nowIso();
    expect(new Date(timestamp).getTime()).toBeGreaterThanOrEqual(before);
  });
});
