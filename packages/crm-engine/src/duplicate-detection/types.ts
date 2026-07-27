/** @module duplicate-detection/types */

export type DuplicateMatchField = 'email' | 'phone' | 'company' | 'name';

export interface DuplicateCandidateInput {
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly company?: string;
}

export interface DuplicateMatch<T> {
  readonly record: T;
  readonly matchedOn: readonly DuplicateMatchField[];
  /** Deterministic weighted score in `[0, 1]` — email carries the most weight, then phone, then company/name. */
  readonly score: number;
}
