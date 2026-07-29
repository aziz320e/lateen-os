/** @module marketplace-catalog/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CatalogEntryId } from '../shared/identifiers.js';

export type { CatalogEntryId };

/** Public catalog metadata for one published extension — categories, publisher, ratings, downloads. Metadata only. */
export interface CatalogEntry extends TenantAuditableEntity<CatalogEntryId> {
  readonly extensionKey: string;
  readonly name: string;
  readonly category: string;
  readonly publisher: string;
  readonly ratingAverage: number;
  readonly ratingCount: number;
  readonly downloadCount: number;
}
