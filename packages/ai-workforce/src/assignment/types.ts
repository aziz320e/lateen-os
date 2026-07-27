/** @module assignment/types */
import type { CapabilityRequirement } from '../skills/types.js';
import type { OrganizationId, TaskId, WorkerId } from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';
import type { AssignmentPriority } from '../collaboration/types.js';

/** Deterministic worker-selection criteria for the Assignment Engine — no AI/LLM involved. */
export interface AssignmentCriteria {
  readonly taskId: TaskId;
  readonly roleCode?: string;
  readonly requirement?: CapabilityRequirement;
  readonly priority: AssignmentPriority;
  readonly dueAt?: Timestamp;
}

export type { OrganizationId, TaskId, WorkerId, AssignmentPriority };
