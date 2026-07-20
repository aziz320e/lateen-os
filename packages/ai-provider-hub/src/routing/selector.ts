/** @module routing/selector */
import type { RoutingDecision, RoutingRequest, RoutingContext } from './types.js';

/** Provider/model selection port — AI Brain consumes this, never direct providers. */
export interface ProviderSelector {
  select(request: RoutingRequest, context: RoutingContext): Promise<RoutingDecision>;
  explain(decision: RoutingDecision): string;
}
