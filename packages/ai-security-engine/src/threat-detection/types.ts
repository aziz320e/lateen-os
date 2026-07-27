/** @module threat-detection/types */
import type { ThreatId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { ThreatId };

/** Deterministic threat kind. */
export type ThreatType = 'prompt_injection' | 'jailbreak' | 'secret_leakage' | 'tool_abuse' | 'rate_abuse';

export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

/** A single detected security threat. */
export interface Threat {
  readonly id: ThreatId;
  readonly organizationId: string;
  readonly threatType: ThreatType;
  readonly severity: ThreatSeverity;
  readonly details: string;
  readonly sourceIdentityId?: string;
  readonly detectedAt: ISODateTime;
}
