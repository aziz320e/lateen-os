/** @module rule/value-objects */
import type { DecisionRuleKind } from './types.js';

/** Rule classification label. */
export interface RuleKindLabel {
  readonly kind: DecisionRuleKind;
  readonly displayName: string;
}
