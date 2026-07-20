/**
 * Domain error — typed failure in domain operations.
 *
 * @module core/domain-error
 */

/** Structured domain-layer error. Throwing/handling is an application concern. */
export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

/** Create a domain error value (pure data — no throwing). */
export function createDomainError(
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): DomainError {
  return details === undefined ? { code, message } : { code, message, details };
}
