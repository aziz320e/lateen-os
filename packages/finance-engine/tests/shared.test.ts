import { describe, expect, it } from 'vitest';
import { addAmounts, compareAmounts, isZeroAmount, multiplyAmount, negateAmount, parseDecimal, percentageOf, subtractAmounts, sumAmounts, toMoney } from '../src/shared/decimal.js';
import { addDaysIso, addMonthsIso, daysBetweenIso } from '../src/shared/date.js';
import { generateId, nowIso } from '../src/shared/id.js';

describe('shared/decimal', () => {
  it('parseDecimal defaults to 0 for undefined/invalid input', () => {
    expect(parseDecimal(undefined)).toBe(0);
    expect(parseDecimal('not-a-number')).toBe(0);
    expect(parseDecimal('12.5')).toBe(12.5);
  });

  it('toMoney formats to 2 decimal places', () => {
    expect(toMoney(1)).toBe('1.00');
    expect(toMoney(1.005)).toBe('1.00');
    expect(toMoney(-3.456)).toBe('-3.46');
  });

  it('addAmounts / subtractAmounts', () => {
    expect(addAmounts('10.50', '5.25')).toBe('15.75');
    expect(subtractAmounts('10.50', '5.25')).toBe('5.25');
    expect(subtractAmounts('5', '10')).toBe('-5.00');
  });

  it('multiplyAmount', () => {
    expect(multiplyAmount('10.00', 3)).toBe('30.00');
    expect(multiplyAmount('10.00', 0.5)).toBe('5.00');
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
    expect(compareAmounts('10.001', '10.002')).toBe(0);
    expect(compareAmounts('9.00', '10.00')).toBe(-1);
    expect(compareAmounts('11.00', '10.00')).toBe(1);
  });

  it('isZeroAmount', () => {
    expect(isZeroAmount('0.00')).toBe(true);
    expect(isZeroAmount('0.001')).toBe(true);
    expect(isZeroAmount('0.01')).toBe(false);
  });

  it('negateAmount', () => {
    expect(negateAmount('5.00')).toBe('-5.00');
    expect(negateAmount('-5.00')).toBe('5.00');
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

  it('daysBetweenIso is 0 for the same date', () => {
    expect(daysBetweenIso('2026-01-01', '2026-01-01')).toBe(0);
  });
});

describe('shared/id', () => {
  it('generateId includes the given prefix', () => {
    expect(generateId('account')).toMatch(/^account-/);
  });

  it('generateId produces unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('x')));
    expect(ids.size).toBe(50);
  });

  it('nowIso returns a valid ISO timestamp', () => {
    expect(() => new Date(nowIso()).toISOString()).not.toThrow();
  });
});
