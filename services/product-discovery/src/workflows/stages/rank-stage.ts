/** @module workflows/stages/rank-stage */
import type { RankStageInput, RankStageOutput } from '../types.js';

/** Stage 3 — rank opportunities by demand, trend, and market fit. */
export interface RankStage {
  execute(input: RankStageInput): Promise<RankStageOutput>;
}
