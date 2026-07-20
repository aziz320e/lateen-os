/** @module lesson/value-objects */
/** Root cause analysis summary. */
export interface RootCauseAnalysis {
  readonly rootCause: string;
  readonly contributingFactors?: readonly string[];
}

/** Actionable recommendation derived from a lesson. */
export interface LessonRecommendation {
  readonly recommendation: string;
  readonly priority?: 'high' | 'medium' | 'low';
}
