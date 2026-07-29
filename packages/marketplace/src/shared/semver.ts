/**
 * A minimal, deterministic semantic-version comparator and range
 * matcher — never an external semver library. Supports plain
 * `MAJOR.MINOR.PATCH` versions and single-operator ranges
 * (`>=`, `<=`, `>`, `<`, `=`, or a bare version treated as `=`).
 *
 * @module shared/semver
 */

export interface ParsedVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

/** Parses a `MAJOR.MINOR.PATCH` string. Missing segments default to 0. */
export function parseVersion(version: string): ParsedVersion {
  const [major = 0, minor = 0, patch = 0] = version
    .trim()
    .split('.')
    .map((segment) => Number.parseInt(segment, 10) || 0);
  return { major, minor, patch };
}

/** `-1` if `a < b`, `0` if equal, `1` if `a > b`. */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (left.major !== right.major) return left.major < right.major ? -1 : 1;
  if (left.minor !== right.minor) return left.minor < right.minor ? -1 : 1;
  if (left.patch !== right.patch) return left.patch < right.patch ? -1 : 1;
  return 0;
}

const RANGE_PATTERN = /^(>=|<=|>|<|=)?\s*(.+)$/;

/** Whether `version` satisfies a single-operator `range` (e.g. `">=1.2.0"`, `"1.0.0"`). Defaults to exact match when no operator is given. */
export function satisfiesRange(version: string, range: string): boolean {
  const match = RANGE_PATTERN.exec(range.trim());
  if (!match) return false;
  const operator = match[1] ?? '=';
  const target = match[2] ?? '';
  const comparison = compareVersions(version, target);
  switch (operator) {
    case '>=':
      return comparison >= 0;
    case '<=':
      return comparison <= 0;
    case '>':
      return comparison > 0;
    case '<':
      return comparison < 0;
    default:
      return comparison === 0;
  }
}
