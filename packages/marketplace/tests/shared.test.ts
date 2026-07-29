import { describe, expect, it } from 'vitest';
import { generateId, nowIso } from '../src/shared/id.js';
import { compareVersions, parseVersion, satisfiesRange } from '../src/shared/semver.js';

describe('shared/id', () => {
  it('generateId includes the given prefix', () => {
    expect(generateId('marketplace-extension')).toMatch(/^marketplace-extension-/);
  });

  it('generateId produces unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('x')));
    expect(ids.size).toBe(50);
  });

  it('generateId produces different ids for different prefixes', () => {
    expect(generateId('a')).not.toBe(generateId('b'));
  });

  it('nowIso returns a valid ISO timestamp', () => {
    expect(() => new Date(nowIso()).toISOString()).not.toThrow();
  });
});

describe('parseVersion (pure)', () => {
  it('parses a standard MAJOR.MINOR.PATCH string', () => {
    expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('defaults missing segments to 0', () => {
    expect(parseVersion('2')).toEqual({ major: 2, minor: 0, patch: 0 });
    expect(parseVersion('2.5')).toEqual({ major: 2, minor: 5, patch: 0 });
  });

  it('handles a version with leading/trailing whitespace', () => {
    expect(parseVersion(' 1.0.0 ')).toEqual({ major: 1, minor: 0, patch: 0 });
  });
});

describe('compareVersions (pure)', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('returns -1 when the major segment is smaller', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
  });

  it('returns 1 when the major segment is larger', () => {
    expect(compareVersions('3.0.0', '2.0.0')).toBe(1);
  });

  it('compares minor segments when major segments are equal', () => {
    expect(compareVersions('1.1.0', '1.2.0')).toBe(-1);
    expect(compareVersions('1.3.0', '1.2.0')).toBe(1);
  });

  it('compares patch segments when major and minor segments are equal', () => {
    expect(compareVersions('1.2.1', '1.2.2')).toBe(-1);
    expect(compareVersions('1.2.5', '1.2.2')).toBe(1);
  });
});

describe('satisfiesRange (pure)', () => {
  it('a bare version range is treated as an exact match', () => {
    expect(satisfiesRange('1.0.0', '1.0.0')).toBe(true);
    expect(satisfiesRange('1.0.1', '1.0.0')).toBe(false);
  });

  it('supports the >= operator', () => {
    expect(satisfiesRange('1.5.0', '>=1.0.0')).toBe(true);
    expect(satisfiesRange('0.9.0', '>=1.0.0')).toBe(false);
    expect(satisfiesRange('1.0.0', '>=1.0.0')).toBe(true);
  });

  it('supports the <= operator', () => {
    expect(satisfiesRange('1.0.0', '<=1.5.0')).toBe(true);
    expect(satisfiesRange('2.0.0', '<=1.5.0')).toBe(false);
  });

  it('supports the > operator, excluding the boundary', () => {
    expect(satisfiesRange('1.0.1', '>1.0.0')).toBe(true);
    expect(satisfiesRange('1.0.0', '>1.0.0')).toBe(false);
  });

  it('supports the < operator, excluding the boundary', () => {
    expect(satisfiesRange('0.9.0', '<1.0.0')).toBe(true);
    expect(satisfiesRange('1.0.0', '<1.0.0')).toBe(false);
  });

  it('supports the explicit = operator', () => {
    expect(satisfiesRange('1.0.0', '=1.0.0')).toBe(true);
    expect(satisfiesRange('1.0.1', '=1.0.0')).toBe(false);
  });

  it('handles whitespace between the operator and the version', () => {
    expect(satisfiesRange('1.5.0', '>= 1.0.0')).toBe(true);
  });

  it('a version exactly on the >= boundary satisfies the range', () => {
    expect(satisfiesRange('2.0.0', '>=2.0.0')).toBe(true);
  });

  it('a version exactly on the <= boundary satisfies the range', () => {
    expect(satisfiesRange('2.0.0', '<=2.0.0')).toBe(true);
  });

  it('compares versions with differing minor/patch precision correctly under >=', () => {
    expect(satisfiesRange('1.10.0', '>=1.9.0')).toBe(true);
  });
});

describe('parseVersion / compareVersions — additional coverage', () => {
  it('parseVersion treats non-numeric segments as 0', () => {
    expect(parseVersion('a.b.c')).toEqual({ major: 0, minor: 0, patch: 0 });
  });

  it('compareVersions is antisymmetric', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-compareVersions('2.0.0', '1.0.0'));
  });

  it('compareVersions treats "1.0" and "1.0.0" as equal', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
  });
});

describe('shared/id — additional coverage', () => {
  it('generateId called rapidly in a tight loop still produces unique ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateId('stress')));
    expect(ids.size).toBe(200);
  });

  it('nowIso never returns a value in the past relative to Date.now() at call time', () => {
    const before = Date.now();
    const timestamp = nowIso();
    expect(new Date(timestamp).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('generateId accepts an empty-string prefix without throwing', () => {
    expect(() => generateId('')).not.toThrow();
  });
});

describe('satisfiesRange — further edge cases', () => {
  it('rejects malformed ranges gracefully by never throwing', () => {
    expect(() => satisfiesRange('1.0.0', '')).not.toThrow();
  });

  it('a >= range at 0.0.0 always matches', () => {
    expect(satisfiesRange('5.5.5', '>=0.0.0')).toBe(true);
  });

  it('a < range against a much higher version is true', () => {
    expect(satisfiesRange('1.0.0', '<99.0.0')).toBe(true);
  });

  it('compareVersions handles double-digit segments correctly (not lexicographic)', () => {
    expect(compareVersions('1.9.0', '1.10.0')).toBe(-1);
  });

  it('satisfiesRange with an exact operator and matching patch version', () => {
    expect(satisfiesRange('1.2.3', '=1.2.3')).toBe(true);
  });

  it('parseVersion of "0.0.0" is all-zero', () => {
    expect(parseVersion('0.0.0')).toEqual({ major: 0, minor: 0, patch: 0 });
  });

  it('compareVersions returns 0 for two default-parsed empty-ish versions', () => {
    expect(compareVersions('0', '0.0.0')).toBe(0);
  });

  it('generateId ids are always strings', () => {
    expect(typeof generateId('x')).toBe('string');
  });

  it('satisfiesRange with a 4+ digit version segment still compares correctly', () => {
    expect(satisfiesRange('1.0.1000', '>=1.0.999')).toBe(true);
  });

  it('compareVersions is transitive', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    expect(compareVersions('2.0.0', '3.0.0')).toBe(-1);
    expect(compareVersions('1.0.0', '3.0.0')).toBe(-1);
  });
});
