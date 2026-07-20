/**
 * Optimistic concurrency version metadata.
 *
 * @module audit/version-info
 */

/** Version counter for optimistic concurrency control on aggregate roots. */
export interface VersionInfo {
  readonly version: number;
}
