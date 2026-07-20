/** @module workflows/stages/normalize-stage */
import type { NormalizeStageInput, NormalizeStageOutput } from '../types.js';

/** Stage 2 — normalize signals into canonical product concepts. */
export interface NormalizeStage {
  execute(input: NormalizeStageInput): Promise<NormalizeStageOutput>;
}
