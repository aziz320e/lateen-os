/**
 * Platform routing port.
 *
 * @module routing/router
 */

import type { ReasoningResult } from '../reasoning/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RoutingDecision } from './types.js';

/** Input for routing decisions. */
export interface RoutingInput {
  readonly organizationId: OrganizationId;
  readonly reasoningResult: ReasoningResult;
}

/** Port for selecting platform services, workflows, missions, and workers. */
export interface PlatformRouter {
  route(input: RoutingInput): Promise<RoutingDecision>;
}
