import { describe, expect, it } from 'vitest';
import { addAmounts, compareAmounts, multiplyAmount, parseDecimal, percentageOf, subtractAmounts, sumAmounts, toMoney } from '../src/shared/decimal.js';
import { addDaysIso, addMonthsIso, dateOnly, daysBetweenIso, minutesBetweenIso } from '../src/shared/date.js';
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
  });

  it('multiplyAmount', () => {
    expect(multiplyAmount('10.00', 3)).toBe('30.00');
  });

  it('percentageOf', () => {
    expect(percentageOf('200.00', '15')).toBe('30.00');
    expect(percentageOf('200.00', undefined)).toBe('0.00');
  });

  it('sumAmounts', () => {
    expect(sumAmounts(['1.10', '2.20', '3.30'])).toBe('6.60');
    expect(sumAmounts([])).toBe('0.00');
  });

  it('compareAmounts', () => {
    expect(compareAmounts('10.00', '10.00')).toBe(0);
    expect(compareAmounts('9.00', '10.00')).toBe(-1);
    expect(compareAmounts('11.00', '10.00')).toBe(1);
  });
});

describe('shared/date', () => {
  it('addMonthsIso adds months within the same year', () => {
    expect(addMonthsIso('2026-01-15', 2)).toBe('2026-03-15');
  });

  it('addMonthsIso rolls over into the next year', () => {
    expect(addMonthsIso('2026-11-01', 3)).toBe('2027-02-01');
  });

  it('addMonthsIso clamps the day to the shorter target month', () => {
    expect(addMonthsIso('2026-01-31', 1)).toBe('2026-02-28');
  });

  it('addDaysIso adds days across a month boundary', () => {
    expect(addDaysIso('2026-01-30', 5)).toBe('2026-02-04');
  });

  it('daysBetweenIso is positive when `to` is after `from`', () => {
    expect(daysBetweenIso('2026-01-01', '2026-01-31')).toBe(30);
  });

  it('daysBetweenIso is negative when `to` precedes `from`', () => {
    expect(daysBetweenIso('2026-01-31', '2026-01-01')).toBe(-30);
  });

  it('minutesBetweenIso computes whole minutes between two date-times', () => {
    expect(minutesBetweenIso('2026-01-01T09:00:00.000Z', '2026-01-01T17:30:00.000Z')).toBe(510);
  });

  it('dateOnly extracts the calendar date portion', () => {
    expect(dateOnly('2026-01-01T09:00:00.000Z')).toBe('2026-01-01');
  });
});

describe('shared/decimal — additional edge cases', () => {
  it('handles negative amounts in addAmounts/subtractAmounts', () => {
    expect(addAmounts('-10.00', '5.00')).toBe('-5.00');
    expect(subtractAmounts('-10.00', '-5.00')).toBe('-5.00');
  });

  it('multiplyAmount handles a negative factor', () => {
    expect(multiplyAmount('10.00', -2)).toBe('-20.00');
  });

  it('compareAmounts treats sub-cent differences as equal', () => {
    expect(compareAmounts('10.001', '10.004')).toBe(0);
  });
});

describe('shared/date — additional edge cases', () => {
  it('addMonthsIso handles a leap-year February', () => {
    expect(addMonthsIso('2027-01-31', 1)).toBe('2027-02-28');
    expect(addMonthsIso('2028-01-31', 1)).toBe('2028-02-29');
  });

  it('addMonthsIso supports negative months', () => {
    expect(addMonthsIso('2026-03-15', -2)).toBe('2026-01-15');
  });

  it('addDaysIso supports negative days', () => {
    expect(addDaysIso('2026-02-04', -5)).toBe('2026-01-30');
  });
});

describe('shared/decimal — sumAmounts with negative values', () => {
  it('sums a mix of positive and negative amounts', () => {
    expect(sumAmounts(['10.00', '-3.00', '2.50'])).toBe('9.50');
  });
});

describe('shared/id', () => {
  it('generateId includes the given prefix', () => {
    expect(generateId('employee')).toMatch(/^employee-/);
  });

  it('generateId produces unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('x')));
    expect(ids.size).toBe(50);
  });

  it('nowIso returns a valid ISO timestamp', () => {
    expect(() => new Date(nowIso()).toISOString()).not.toThrow();
  });
});
