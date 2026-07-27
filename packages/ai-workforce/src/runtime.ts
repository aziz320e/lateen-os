/**
 * AI Workforce Runtime — the package's composition root. Wires every real
 * in-memory repository and service together: the Worker Registry, the
 * Worker Lifecycle state machine, the Capability Engine, the Capacity
 * Engine, the deterministic Assignment Engine, the Performance Engine,
 * the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link WorkforceRuntime} surface.
 *
 * @module runtime
 */
import { createWorkerRegistrationRepository, createWorkerRegistryRepository, createWorkerRegistryService, type WorkerRegistryService } from './registry/index.js';
import { createWorkerLifecycle, createWorkerRepository, type WorkerLifecycleService } from './worker/index.js';
import { createCapabilityEngine, createSkillDefinitionRepository, type CapabilityEngine } from './skills/index.js';
import { createCapacityEngine, type CapacityEngine } from './availability/index.js';
import { createTaskAssignmentRepository } from './collaboration/index.js';
import { createAssignmentEngine, type AssignmentEngine } from './assignment/index.js';
import { createPerformanceEngine, createPerformanceMetricsRepository, type PerformanceEngine } from './performance/index.js';
import { createWorkforceRuntimeQueries, type WorkforceRuntimeQueries } from './queries/index.js';
import { createWorkforceEventBus, type WorkforceEventBus } from './events/index.js';
import { nowIso } from './shared/id.js';

export interface WorkforceRuntimeDeps {
  readonly eventBus?: WorkforceEventBus;
  readonly now?: () => string;
}

export interface WorkforceRuntime {
  readonly registry: WorkerRegistryService;
  readonly lifecycle: WorkerLifecycleService;
  readonly assignment: AssignmentEngine;
  readonly capacity: CapacityEngine;
  readonly performance: PerformanceEngine;
  readonly capabilities: CapabilityEngine;
  readonly queries: WorkforceRuntimeQueries;
  /** Typed event bus — subscribe to worker/assignment/capacity/performance events. */
  readonly events: WorkforceEventBus;
}

/** Creates a real, in-memory {@link WorkforceRuntime}. */
export function createWorkforceRuntime(deps: WorkforceRuntimeDeps = {}): WorkforceRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createWorkforceEventBus();

  const workerRepository = createWorkerRepository();
  const registrationRepository = createWorkerRegistrationRepository();
  const registryRepository = createWorkerRegistryRepository();
  const skillDefinitionRepository = createSkillDefinitionRepository();
  const performanceMetricsRepository = createPerformanceMetricsRepository();
  const assignmentRepository = createTaskAssignmentRepository();

  const lifecycle = createWorkerLifecycle(workerRepository, eventBus, now);
  const registry = createWorkerRegistryService(workerRepository, registrationRepository, registryRepository, lifecycle, now);
  const capabilities = createCapabilityEngine(skillDefinitionRepository);
  const capacity = createCapacityEngine(workerRepository, eventBus, now);
  const performance = createPerformanceEngine(performanceMetricsRepository, eventBus, now);

  const assignment = createAssignmentEngine({
    workerRepository,
    assignmentRepository,
    capacityEngine: capacity,
    capabilityEngine: capabilities,
    performanceRecorder: performance,
    eventBus,
    now,
  });

  const queries = createWorkforceRuntimeQueries({
    workerRepository,
    assignmentRepository,
    skillDefinitionRepository,
    performanceMetricsRepository,
    capacityEngine: capacity,
    performanceEngine: performance,
  });

  return {
    registry,
    lifecycle,
    assignment,
    capacity,
    performance,
    capabilities,
    queries,
    events: eventBus,
  };
}
