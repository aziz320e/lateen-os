/**
 * Result type — explicit success/failure without exceptions.
 *
 * @module core/result
 */

import type { DomainError } from './domain-error.js';

/** Successful outcome carrying a value. */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/** Failed outcome carrying a domain error. */
export interface Err<E extends DomainError = DomainError> {
  readonly ok: false;
  readonly error: E;
}

/** Discriminated union for domain operation outcomes. */
export type Result<T, E extends DomainError = DomainError> = Ok<T> | Err<E>;

/** Construct a successful result. */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/** Construct a failed result. */
export function err<E extends DomainError = DomainError>(error: E): Err<E> {
  return { ok: false, error };
}

/** Type guard for successful results. */
export function isOk<T, E extends DomainError>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

/** Type guard for failed results. */
export function isErr<T, E extends DomainError>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}
