/**
 * Enterprise reasoning port.
 *
 * Distinct from `@lateen-os/decision-engine` Reasoner — orchestrates platform-wide reasoning.
 *
 * @module reasoning/reasoner
 */

import type { Intent } from '../intent/types.js';
import type { EnterpriseContext } from '../context/types.js';
import type { OrganizationId, ReasoningSessionId } from '../shared/identifiers.js';
import type { ReasoningResult } from './types.js';

/** Input for enterprise reasoning. */
export interface ReasoningInput {
  readonly organizationId: OrganizationId;
  readonly sessionId: ReasoningSessionId;
  readonly intent: Intent;
  readonly context: EnterpriseContext;
}

/** Port for reasoning over enterprise context to produce orchestration decisions. */
export interface EnterpriseReasoner {
  reason(input: ReasoningInput): Promise<ReasoningResult>;
}
