import { describe, expect, it } from 'vitest';
import { addAmounts, parseDecimal, subtractAmounts, toMoney } from '../src/shared/decimal.js';
import { addDaysIso, daysBetweenIso } from '../src/shared/date.js';
import { generateId, nowIso } from '../src/shared/id.js';

describe('shared/decimal', () => {
  it('parseDecimal defaults to 0 for undefined/invalid input', () => {
    expect(parseDecimal(undefined)).toBe(0);
    expect(parseDecimal('not-a-number')).toBe(0);
    expect(parseDecimal('12.5')).toBe(12.5);
  });

  it('parseDecimal parses a negative decimal string', () => {
    expect(parseDecimal('-42.75')).toBe(-42.75);
  });

  it('toMoney formats to 2 decimal places', () => {
    expect(toMoney(1)).toBe('1.00');
    expect(toMoney(-3.456)).toBe('-3.46');
  });

  it('toMoney rounds half-up at the cent boundary', () => {
    expect(toMoney(1.005)).toBe('1.00');
    expect(toMoney(1.015)).toBe('1.01');
  });

  it('addAmounts / subtractAmounts', () => {
    expect(addAmounts('10.50', '5.25')).toBe('15.75');
    expect(subtractAmounts('10.50', '5.25')).toBe('5.25');
    expect(subtractAmounts('5', '10')).toBe('-5.00');
  });

  it('handles negative amounts', () => {
    expect(addAmounts('-10.00', '5.00')).toBe('-5.00');
  });

  it('addAmounts treats an empty string as 0', () => {
    expect(addAmounts('', '5.00')).toBe('5.00');
  });

  it('subtractAmounts returns 0.00 when both sides are equal', () => {
    expect(subtractAmounts('10.00', '10.00')).toBe('0.00');
  });
});

describe('shared/date', () => {
  it('daysBetweenIso is positive when `to` is after `from`', () => {
    expect(daysBetweenIso('2026-01-01', '2026-01-31')).toBe(30);
  });

  it('daysBetweenIso is 0 for the same date', () => {
    expect(daysBetweenIso('2026-01-01', '2026-01-01')).toBe(0);
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

  it('daysBetweenIso is negative when `to` precedes `from`', () => {
    expect(daysBetweenIso('2026-01-31', '2026-01-01')).toBe(-30);
  });

  it('daysBetweenIso handles a leap-year February', () => {
    expect(daysBetweenIso('2028-02-01', '2028-03-01')).toBe(29);
  });
});

describe('shared/decimal — additional edge cases', () => {
  it('addAmounts handles two negative amounts', () => {
    expect(addAmounts('-5.00', '-3.00')).toBe('-8.00');
  });

  it('toMoney handles exactly zero', () => {
    expect(toMoney(0)).toBe('0.00');
  });
});

describe('shared/date — additional edge cases', () => {
  it('daysBetweenIso handles a full calendar year span', () => {
    expect(daysBetweenIso('2026-01-01', '2027-01-01')).toBe(365);
  });
});

describe('shared/id', () => {
  it('generateId includes the given prefix', () => {
    expect(generateId('customer-success-record')).toMatch(/^customer-success-record-/);
  });

  it('generateId produces unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('x')));
    expect(ids.size).toBe(50);
  });

  it('nowIso returns a valid ISO timestamp', () => {
    expect(() => new Date(nowIso()).toISOString()).not.toThrow();
  });
});
