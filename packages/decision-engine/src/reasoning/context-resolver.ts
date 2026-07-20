/**
 * Context resolver port — assembles DecisionContext from upstream packages.
 *
 * @module reasoning/context-resolver
 */

import type { DecisionId, OrganizationId } from '../shared/identifiers.js';
import type { DecisionContext } from '../context/types.js';

/** Options for assembling decision context. */
export interface DecisionContextResolveOptions {
  readonly organizationId: OrganizationId;
  readonly decisionId: DecisionId;
  readonly includeMetrics?: boolean;
  readonly includeMemory?: boolean;
  readonly includeGraph?: boolean;
}

/** Port for resolving decision context from Business DNA, Capability Engine, Domain Graph, and Institutional Memory. */
export interface ContextResolver {
  resolveContext(options: DecisionContextResolveOptions): Promise<DecisionContext>;
}
