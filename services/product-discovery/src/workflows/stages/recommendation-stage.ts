/** @module workflows/stages/recommendation-stage */
import type {
  RecommendationStageInput,
  RecommendationStageOutput,
} from '../types.js';

/** Stage 7 — produce final manufacturable product recommendations. */
export interface RecommendationStage {
  execute(input: RecommendationStageInput): Promise<RecommendationStageOutput>;
}
