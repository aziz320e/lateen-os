/**
 * Guard — preconditions and argument validation contracts.
 *
 * Guards express invariants as data. Enforcement logic lives in application
 * or domain services; this module provides types and generic null/empty checks only.
 *
 * @module core/guard
 */

import type { DomainError } from './domain-error.js';
import { createDomainError } from './domain-error.js';
import type { Result } from './result.js';
import { err, ok } from './result.js';

/** Outcome of a guard check. */
export type GuardResult = Result<void, DomainError>;

/** Contract for a reusable guard clause. */
export interface GuardClause {
  check(value: unknown): GuardResult;
}

/** Guard failure with a stable error code. */
export function guardFail(code: string, message: string): GuardResult {
  return err(createDomainError(code, message));
}

/** Guard success (precondition satisfied). */
export function guardPass(): GuardResult {
  return ok(undefined);
}

/** Returns true when value is null or undefined. */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/** Returns true when value is a non-empty string. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Returns true when value is a defined, non-null value. */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
