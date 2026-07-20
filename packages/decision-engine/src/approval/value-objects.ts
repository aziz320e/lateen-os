/** @module approval/value-objects */
import type { Approver } from './types.js';

/** Approver assignment for a workflow step. */
export interface ApproverAssignment {
  readonly approvers: readonly Approver[];
  readonly requireAll: boolean;
}
