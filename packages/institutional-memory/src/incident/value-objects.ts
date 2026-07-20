/** @module incident/value-objects */
import type { IncidentSeverity } from './types.js';

/** Impact assessment for an incident. */
export interface IncidentImpact {
  readonly summary: string;
  readonly severity: IncidentSeverity;
  readonly affectedAreas?: readonly string[];
}

/** Preventive measures derived from an incident. */
export interface IncidentPrevention {
  readonly measures: readonly string[];
}
