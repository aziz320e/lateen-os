/** @module workflows/stages/collect-signals-stage */
import type {
  CollectSignalsStageInput,
  CollectSignalsStageOutput,
} from '../types.js';

/** Stage 1 — collect raw signals from all configured adapters. */
export interface CollectSignalsStage {
  execute(input: CollectSignalsStageInput): Promise<CollectSignalsStageOutput>;
}
