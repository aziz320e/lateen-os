/** @module workflows/stages/decision-submission-stage */
import type {
  DecisionSubmissionStageInput,
  DecisionSubmissionStageOutput,
} from '../types.js';

/** Stage 6 — submit top opportunities to the Decision Engine. */
export interface DecisionSubmissionStage {
  execute(input: DecisionSubmissionStageInput): Promise<DecisionSubmissionStageOutput>;
}
