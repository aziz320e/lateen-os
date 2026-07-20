/** @module memory/value-objects */
import type { MemoryCategory, ImportanceLevel } from '../classification/types.js';
import type { ConfidenceScore } from '../confidence/types.js';

/** Summary block for memory discovery and preview. */
export interface MemorySummary {
  readonly title: string;
  readonly summary: string;
}

/** Classification bundle on a memory artifact. */
export interface MemoryClassification {
  readonly category: MemoryCategory;
  readonly importance: ImportanceLevel;
  readonly confidence: ConfidenceScore;
}
