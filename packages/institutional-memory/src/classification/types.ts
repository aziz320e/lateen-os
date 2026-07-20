/**
 * Memory classification types — category, importance, visibility, retention.
 *
 * @module classification/types
 */

/** High-level classification of institutional memory content. */
export type MemoryCategory =
  | 'operational'
  | 'strategic'
  | 'technical'
  | 'commercial'
  | 'compliance'
  | 'safety'
  | 'quality'
  | 'people'
  | 'customer'
  | 'supplier'
  | 'process'
  | 'general';

/** Relative importance of a memory artifact for retrieval and alerting. */
export type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low' | 'archival';

/** Access scope for memory visibility within the organization. */
export type Visibility = 'organization' | 'department' | 'team' | 'private' | 'restricted';

/** Retention policy governing how long memory is kept active. */
export interface RetentionPolicy {
  readonly retainForDays?: number;
  readonly archiveAfterDays?: number;
  readonly purgeAfterDays?: number;
  readonly legalHold?: boolean;
}
