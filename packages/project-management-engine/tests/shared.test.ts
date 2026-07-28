import { describe, expect, it } from 'vitest';
import { addAmounts, compareAmounts, multiplyAmount, parseDecimal, subtractAmounts, sumAmounts, toMoney } from '../src/shared/decimal.js';
import { addDaysIso, daysBetweenIso, minutesBetweenIso } from '../src/shared/date.js';
import { generateId, nowIso } from '../src/shared/id.js';

describe('shared/decimal', () => {
  it('parseDecimal defaults to 0 for undefined/invalid input', () => {
    expect(parseDecimal(undefined)).toBe(0);
    expect(parseDecimal('not-a-number')).toBe(0);
    expect(parseDecimal('12.5')).toBe(12.5);
  });

  it('toMoney formats to 2 decimal places', () => {
    expect(toMoney(1)).toBe('1.00');
    expect(toMoney(-3.456)).toBe('-3.46');
  });

  it('addAmounts / subtractAmounts', () => {
    expect(addAmounts('10.50', '5.25')).toBe('15.75');
    expect(subtractAmounts('10.50', '5.25')).toBe('5.25');
    expect(subtractAmounts('5', '10')).toBe('-5.00');
  });

  it('multiplyAmount', () => {
    expect(multiplyAmount('10.00', 3)).toBe('30.00');
    expect(multiplyAmount('10.00', -2)).toBe('-20.00');
  });

  it('sumAmounts', () => {
    expect(sumAmounts(['1.10', '2.20', '3.30'])).toBe('6.60');
    expect(sumAmounts([])).toBe('0.00');
  });

  it('compareAmounts', () => {
    expect(compareAmounts('10.00', '10.00')).toBe(0);
    expect(compareAmounts('10.001', '10.002')).toBe(0);
    expect(compareAmounts('9.00', '10.00')).toBe(-1);
    expect(compareAmounts('11.00', '10.00')).toBe(1);
  });

  it('handles negative amounts in addAmounts/subtractAmounts', () => {
    expect(addAmounts('-10.00', '5.00')).toBe('-5.00');
    expect(subtractAmounts('-10.00', '-5.00')).toBe('-5.00');
  });

  it('sumAmounts handles a mix of positive and negative amounts', () => {
    expect(sumAmounts(['10.00', '-3.00', '2.50'])).toBe('9.50');
  });

  it('rounds half-up for positive values at the cent boundary', () => {
    expect(toMoney(1.005)).toBe('1.00');
    expect(toMoney(1.015)).toBe('1.01');
  });
});

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

  it('minutesBetweenIso computes elapsed minutes', () => {
    expect(minutesBetweenIso('2026-01-01T09:00:00.000Z', '2026-01-01T17:00:00.000Z')).toBe(480);
  });

  it('minutesBetweenIso is negative when `to` precedes `from`', () => {
    expect(minutesBetweenIso('2026-01-01T17:00:00.000Z', '2026-01-01T09:00:00.000Z')).toBe(-480);
  });
});

describe('shared/id', () => {
  it('generateId includes the given prefix', () => {
    expect(generateId('project')).toMatch(/^project-/);
  });

  it('generateId produces unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('x')));
    expect(ids.size).toBe(50);
  });

  it('nowIso returns a valid ISO timestamp', () => {
    expect(() => new Date(nowIso()).toISOString()).not.toThrow();
  });
});
