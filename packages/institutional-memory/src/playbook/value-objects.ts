/** @module playbook/value-objects */
/** Expected outcome description for a playbook execution. */
export interface ExpectedOutcome {
  readonly description: string;
  readonly successCriteria?: readonly string[];
}
