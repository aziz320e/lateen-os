/** @module domain/capability-match */
import type {
  CapabilityId,
  CapabilityMatchId,
  OrganizationId,
  RankedOpportunityId,
} from './identifiers.js';
import type { ScoreValue } from './primitives.js';

export type CapabilityMatchStatus = 'full' | 'partial' | 'gap' | 'unknown';

export interface MatchedCapability {
  readonly capabilityId: CapabilityId;
  readonly label: string;
  readonly available: boolean;
  readonly matchScore: ScoreValue;
}

/** Capability alignment for a ranked opportunity. */
export interface CapabilityMatch {
  readonly matchId: CapabilityMatchId;
  readonly organizationId: OrganizationId;
  readonly opportunityId: RankedOpportunityId;
  readonly status: CapabilityMatchStatus;
  readonly matchedCapabilities: readonly MatchedCapability[];
  readonly missingCapabilities: readonly CapabilityId[];
  readonly overallMatchScore: ScoreValue;
  readonly manufacturable: boolean;
}

export interface CapabilityMatchingResult {
  readonly matches: readonly CapabilityMatch[];
}
