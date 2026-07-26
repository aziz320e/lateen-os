/**
 * The Lateen composition root. `createLateen()` wires ProviderHub ->
 * DecisionEngine -> IntelligenceEngine -> Runtime -> Brain -> CEO with
 * dependency injection (chat provider into Runtime; agent registry and
 * decision queries into Brain) and returns the full {@link LateenSystem}.
 *
 * `LateenSystem` is the complete, full-power composition — every engine
 * facade, for the process that owns this system. `LateenClient` is a
 * narrower, read-oriented subset (queries plus mission lookup, no mission
 * mutation, no reasoner/planner/orchestrator access) — the surface safe to
 * hand to a less-trusted consumer, e.g. a UI layer.
 *
 * @module system/create-lateen
 */
import type { BrainEventBus } from '@lateen-os/ai-brain';
import type { DecisionQueries } from '@lateen-os/decision-engine';
import type { IntelligenceQueries } from '@lateen-os/intelligence-engine';
import type { ProviderQueries } from '@lateen-os/ai-provider-hub';
import type { RuntimeEventBus, RuntimeQueries } from '@lateen-os/ai-runtime';
import { type Brain, createBrainFacade } from './brain.js';
import { type CEO, createCEO } from './ceo.js';
import { createDecisionEngineFacade, type DecisionEngine } from './decision-engine.js';
import { createIntelligenceEngineFacade, type IntelligenceEngine } from './intelligence-engine.js';
import { createProviderHub, type ProviderHub, type ProviderHubConfig } from './provider-hub.js';
import { createRuntimeFacade, type Runtime } from './runtime.js';
import type { BrainQueries } from '@lateen-os/ai-brain';

export interface LateenConfig {
  readonly providers?: ProviderHubConfig;
  readonly eventBuses?: {
    readonly runtime?: RuntimeEventBus;
    readonly brain?: BrainEventBus;
  };
}

/**
 * Narrow, read-oriented public surface: query interfaces for every engine
 * plus mission lookup. No mission mutation, no reasoner/planner/
 * orchestrator/conversation access — safe to hand to a less-trusted
 * consumer.
 */
export interface LateenClient {
  readonly ceo: Pick<CEO, 'getMission' | 'listMissions'>;
  readonly brain: { readonly queries: BrainQueries };
  readonly runtime: { readonly queries: RuntimeQueries };
  readonly decisions: DecisionQueries;
  readonly intelligence: IntelligenceQueries;
  readonly providers: ProviderQueries;
}

/** The full composed Lateen OS runtime: every engine facade, plus the narrower {@link LateenClient}. */
export interface LateenSystem {
  readonly providerHub: ProviderHub;
  readonly decisionEngine: DecisionEngine;
  readonly intelligenceEngine: IntelligenceEngine;
  readonly runtime: Runtime;
  readonly brain: Brain;
  readonly ceo: CEO;
  readonly client: LateenClient;
}

/** Creates a fully-wired {@link LateenSystem} — the official entry point into Lateen OS. */
export function createLateen(config: LateenConfig = {}): LateenSystem {
  const providerHub = createProviderHub(config.providers);
  const decisionEngine = createDecisionEngineFacade();
  const intelligenceEngine = createIntelligenceEngineFacade();

  const runtime = createRuntimeFacade({
    chatProvider: providerHub.capabilities.chat,
    eventBus: config.eventBuses?.runtime,
  });

  const brain = createBrainFacade({
    agentRegistry: runtime.agentRegistry,
    decisionQueries: decisionEngine.queries,
    eventBus: config.eventBuses?.brain,
  });

  const ceo = createCEO();

  const client: LateenClient = {
    ceo: { getMission: ceo.getMission, listMissions: ceo.listMissions },
    brain: { queries: brain.queries },
    runtime: { queries: runtime.queries },
    decisions: decisionEngine.queries,
    intelligence: intelligenceEngine.queries,
    providers: providerHub.capabilities.queries,
  };

  return { providerHub, decisionEngine, intelligenceEngine, runtime, brain, ceo, client };
}
