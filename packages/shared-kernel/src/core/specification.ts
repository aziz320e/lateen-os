/**
 * Specification pattern — composable business rule contracts.
 *
 * Implementations with domain rules live in bounded contexts;
 * this module defines the port interface only.
 *
 * @module core/specification
 */

/** A rule that determines whether a candidate satisfies a business condition. */
export interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
}

/** Combines two specifications with logical AND. */
export interface AndSpecification<T> extends Specification<T> {
  readonly left: Specification<T>;
  readonly right: Specification<T>;
}

/** Combines two specifications with logical OR. */
export interface OrSpecification<T> extends Specification<T> {
  readonly left: Specification<T>;
  readonly right: Specification<T>;
}

/** Negates a specification. */
export interface NotSpecification<T> extends Specification<T> {
  readonly inner: Specification<T>;
}
