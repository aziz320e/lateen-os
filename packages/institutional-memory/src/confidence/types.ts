/**
 * Confidence and evidence types for memory artifacts.
 *
 * @module confidence/types
 */

import type { EvidenceId } from '../shared/identifiers.js';
import type { MemorySourceLabel } from '../shared/primitives.js';

/** Confidence score as a decimal string (0–100). */
export type ConfidenceScore = string;

/** Source of evidence supporting a memory artifact. */
export type EvidenceSource =
  | 'direct_observation'
  | 'meeting_minutes'
  | 'incident_report'
  | 'research_study'
  | 'customer_feedback'
  | 'kpi_data'
  | 'expert_judgment'
  | 'external_publication'
  | 'policy_document'
  | 'other';

/** Supporting evidence for a memory claim or conclusion. */
export interface Evidence {
  readonly evidenceId: EvidenceId;
  readonly source: EvidenceSource;
  readonly sourceLabel?: MemorySourceLabel;
  readonly description?: string;
  readonly recordedAt: string;
}
