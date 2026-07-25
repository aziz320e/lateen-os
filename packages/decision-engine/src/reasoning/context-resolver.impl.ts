/**
 * Real {@link ContextResolver} implementation. Returns a previously-saved
 * {@link DecisionContext} if one exists for the decision, otherwise
 * assembles a valid, empty-but-correctly-shaped context ready to be
 * enriched with real Business DNA / Domain Graph / Institutional Memory
 * references by the caller (populating those refs is an infrastructure
 * concern outside this package, per its own architecture doc).
 *
 * @module reasoning/context-resolver.impl
 */
import { randomUUID } from 'node:crypto';
import type { DecisionContextRepository } from '../context/repository.js';
import type { ContextResolver, DecisionContextResolveOptions } from './context-resolver.js';

export interface ContextResolverDeps {
  readonly contextRepository: DecisionContextRepository;
}

/** Creates a {@link ContextResolver} backed by a {@link DecisionContextRepository}. */
export function createContextResolver(deps: ContextResolverDeps): ContextResolver {
  return {
    async resolveContext(options: DecisionContextResolveOptions) {
      const existing = await deps.contextRepository.findByDecision(options.organizationId, options.decisionId);
      if (existing) return existing;

      const now = new Date().toISOString();
      return {
        id: randomUUID(),
        organizationId: options.organizationId,
        createdAt: now,
        updatedAt: now,
        decisionId: options.decisionId,
        businessDnaRefs: [],
        capabilityRefs: [],
        currentMetrics: [],
        currentPolicies: [],
      };
    },
  };
}
