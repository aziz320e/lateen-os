/** @module workflows/stages/capability-matching-stage */
import type {
  CapabilityMatchingStageInput,
  CapabilityMatchingStageOutput,
} from '../types.js';

/** Stage 4 — match opportunities to existing manufacturing capabilities. */
export interface CapabilityMatchingStage {
  execute(input: CapabilityMatchingStageInput): Promise<CapabilityMatchingStageOutput>;
}
