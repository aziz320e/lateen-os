/**
 * Percentage value object.
 *
 * @module common/percentage
 */

/**
 * Percentage as a decimal string (e.g. `"15.5"` for 15.5%).
 * Stored as string to preserve precision; range validation is an application concern.
 */
export type Percentage = string;
