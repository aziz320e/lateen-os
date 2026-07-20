/**
 * Cross-aggregate enumerations shared across Business DNA.
 * Owned by no single aggregate — referenced by multiple entities.
 *
 * @module shared/enums
 */

/** Service level agreement tier — defined at Organization, referenced by Customer and Project. */
export type SlaTier = 'standard' | 'priority' | 'enterprise';

/** Geographic region within Saudi Arabia and the GCC. */
export type RegionCoverage =
  | 'central'
  | 'western'
  | 'eastern'
  | 'northern'
  | 'southern'
  | 'nationwide';
