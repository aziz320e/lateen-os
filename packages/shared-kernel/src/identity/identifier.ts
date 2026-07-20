/**
 * Generic identifier abstraction for domain entities and value objects.
 *
 * @module identity/identifier
 */

import type { UUID } from './uuid.js';

/**
 * Base identifier type for all domain entities.
 * Alias of {@link UUID} — keeps a semantic name at aggregate boundaries.
 */
export type Identifier = UUID;

/** Branded identifier factory type for domain-specific ID aliases. */
export type BrandedIdentifier<TBrand extends string> = Identifier & {
  readonly __brand: TBrand;
};
