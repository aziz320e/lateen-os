/**
 * Brain facade — a thin wrapper over `@lateen-os/ai-brain`'s already-clean
 * `createBrainSystem` composition root, merging its `Brain.process()` and
 * `BrainQueries` into one object so callers don't juggle two handles.
 *
 * @module system/brain
 */
import { createBrainSystem } from '@lateen-os/ai-brain';
import type {
  AgentRegistryService,
} from '@lateen-os/ai-runtime';
import type { DecisionQueries } from '@lateen-os/decision-engine';
import type {
  Brain as AiBrain,
  BrainEventBus,
  BrainQueries,
} from '@lateen-os/ai-brain';

export interface BrainConfig {
  /** Real ai-runtime collaborator — typically `runtime.agentRegistry`. */
  readonly agentRegistry?: AgentRegistryService;
  /** Real decision-engine collaborator — typically `decisionEngine.queries`. */
  readonly decisionQueries?: DecisionQueries;
  readonly eventBus?: BrainEventBus;
}

/** Public brain facade — `Brain.process()` plus its read-only query layer. */
export interface Brain extends AiBrain {
  readonly queries: BrainQueries;
}

/** Creates a {@link Brain}. */
export function createBrainFacade(config: BrainConfig = {}): Brain {
  const { brain, queries } = createBrainSystem({
    agentRegistry: config.agentRegistry,
    decisionQueries: config.decisionQueries,
    eventBus: config.eventBus,
  });

  return { ...brain, queries };
}
