/**
 * Real {@link ProviderSelector} implementation, wiring the already-real
 * {@link applyRoutingStrategy} pure function into the async selector port.
 *
 * @module routing/selector.impl
 */
import { applyRoutingStrategy } from './strategies.js';
import type { ProviderSelector } from './selector.js';

/** Creates a {@link ProviderSelector} backed by the pure routing-strategy functions. */
export function createProviderSelector(): ProviderSelector {
  return {
    async select(request, context) {
      const decision = applyRoutingStrategy(request, context);
      if (!decision) {
        throw new Error(
          `No provider/model available for capability "${request.capability}" using strategy "${request.policy.strategy}"`,
        );
      }
      return decision;
    },
    explain(decision) {
      return `Routed to provider "${decision.providerId}" / model "${decision.modelId}" via "${decision.strategy}" strategy — ${decision.reason}.`;
    },
  };
}
