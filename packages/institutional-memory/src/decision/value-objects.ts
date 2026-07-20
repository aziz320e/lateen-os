/** @module decision/value-objects */
/** A considered alternative that was not selected. */
export interface DecisionAlternative {
  readonly description: string;
  readonly rejectedReason?: string;
}

/** Decision outcome summary after implementation. */
export interface DecisionOutcome {
  readonly summary: string;
  readonly measuredAt?: string;
}
