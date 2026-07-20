/** @module workflows/stages/profit-estimation-stage */
import type {
  ProfitEstimationStageInput,
  ProfitEstimationStageOutput,
} from '../types.js';

/** Stage 5 — estimate profit potential for manufacturable opportunities. */
export interface ProfitEstimationStage {
  execute(input: ProfitEstimationStageInput): Promise<ProfitEstimationStageOutput>;
}
