/** @module knowledge/value-objects */
import type { KnowledgeType } from './types.js';

/** Typed knowledge classification label. */
export interface KnowledgeTypeLabel {
  readonly type: KnowledgeType;
  readonly displayName: string;
}
