/**
 * Universally unique identifier primitive.
 *
 * UUIDs are opaque strings (RFC 4122) used as the physical representation
 * of entity and value object identifiers across Lateen OS.
 *
 * @module identity/uuid
 */

/** RFC 4122 UUID string. Opaque at the type level — validation is an infrastructure concern. */
export type UUID = string;
