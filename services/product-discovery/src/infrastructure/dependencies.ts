/** @module infrastructure/dependencies */
import type {
  AiRuntimePort,
  BusinessDnaPort,
  CapabilityEnginePort,
  DecisionEnginePort,
  DomainGraphPort,
  InstitutionalMemoryPort,
  IntelligenceEnginePort,
  SignalAggregatorPort,
} from '../ports/outbound/index.js';
import type { ProductDiscoverySignalAdapter } from '../adapters/index.js';

/** All outbound dependencies required to wire the service. */
export interface ProductDiscoveryDependencies {
  readonly businessDna: BusinessDnaPort;
  readonly capabilityEngine: CapabilityEnginePort;
  readonly domainGraph: DomainGraphPort;
  readonly institutionalMemory: InstitutionalMemoryPort;
  readonly decisionEngine: DecisionEnginePort;
  readonly intelligenceEngine: IntelligenceEnginePort;
  readonly aiRuntime: AiRuntimePort;
  readonly signalAggregator: SignalAggregatorPort;
  readonly signalAdapters: readonly ProductDiscoverySignalAdapter[];
}
