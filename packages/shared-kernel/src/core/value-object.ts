/**
 * Value object marker — immutable objects compared by structure, not identity.
 *
 * @module core/value-object
 */

/** Marker interface for value objects. Implementations should be immutable. */
export interface ValueObject {
  equals(other: unknown): boolean;
}
