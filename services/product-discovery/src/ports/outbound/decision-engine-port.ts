/** @module ports/outbound/decision-engine-port */
import type { Decision, Recommendation } from '@lateen-os/decision-engine';
import type { DecisionQueries } from '@lateen-os/decision-engine';
import type { DecisionSubmission } from '../../domain/decision-submission.js';
import type { DecisionId, OrganizationId } from '../../domain/identifiers.js';

/** Outbound port to Decision Engine — submit and track decisions. */
export interface DecisionEnginePort extends DecisionQueries {
  submitForDecision(
    organizationId: OrganizationId,
    submission: DecisionSubmission,
  ): Promise<Decision>;

  getRecommendation(
    organizationId: OrganizationId,
    decisionId: DecisionId,
  ): Promise<readonly Recommendation[]>;
}
