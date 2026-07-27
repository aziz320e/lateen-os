/** @module metrics/types */

/** Deterministic, computed sales performance metrics for an organization. */
export interface SalesPerformanceMetrics {
  readonly organizationId: string;
  /** Percentage of closed deals (won + lost) that were won, e.g. `"62.50"`. */
  readonly winRate: string;
  /** Percentage of closed deals (won + lost) that were lost. */
  readonly lossRate: string;
  readonly averageDealSize: string;
  readonly averageSalesCycleDays: string;
  readonly pipelineValue: string;
  readonly closedWonCount: number;
  readonly closedLostCount: number;
  readonly openCount: number;
}
