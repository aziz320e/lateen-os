/**
 * Real platform routing — deterministic. Genuinely invokes AI Runtime's
 * {@link AgentRegistryService} (when injected) to route worker plans to an
 * actually-registered runtime agent, falling back to a generalist worker
 * when no registry is injected or no agent is registered yet. Mission and
 * workflow routes are structural (multi-agent and workflow-engine are
 * contracts-only today) but shaped to match those packages' real id types.
 *
 * @module routing/router.impl
 */
import type { AgentRegistryService } from '@lateen-os/ai-runtime';
import { generateId, nowIso } from '../shared/id.js';
import type { PlatformRouter, RoutingInput } from './router.js';
import type { MissionRoute, RoutingDecision, ServiceRoute, WorkerRoute, WorkflowRoute } from './types.js';

export interface PlatformRouterDeps {
  readonly agentRegistry?: AgentRegistryService;
}

const SERVICE_TARGETS: Readonly<Record<string, { readonly serviceName: string; readonly endpoint: string; readonly operation: string }>> = {
  decision: { serviceName: 'decision-engine', endpoint: 'decision-engine://evaluate', operation: 'evaluate' },
  analysis: { serviceName: 'intelligence-engine', endpoint: 'intelligence-engine://analyze', operation: 'analyze' },
  query: { serviceName: 'institutional-memory', endpoint: 'institutional-memory://search', operation: 'search' },
};

async function resolveWorkerRoute(
  organizationId: string,
  intentType: string,
  agentRegistry: AgentRegistryService | undefined,
): Promise<WorkerRoute> {
  const now = nowIso();

  if (agentRegistry) {
    const registry = await agentRegistry.getRegistry(organizationId);
    const active = registry.registrations.find((registration) => registration.active);
    if (active) {
      return {
        id: generateId('worker-route'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        workerId: active.descriptor.businessDnaAgentId,
        role: active.descriptor.profile.workforceType,
        confidence: '0.80',
        rationale: `Routed to registered runtime agent "${active.descriptor.runtimeAgentId}" for a "${intentType}" intent.`,
      };
    }
  }

  return {
    id: generateId('worker-route'),
    organizationId,
    createdAt: now,
    updatedAt: now,
    workerId: generateId('fallback-worker'),
    role: 'generalist',
    confidence: '0.40',
    rationale: 'No registered runtime agent available — routed to a generalist fallback worker.',
  };
}

function serviceRouteFor(intentType: string, organizationId: string): ServiceRoute | undefined {
  const target = SERVICE_TARGETS[intentType];
  if (!target) return undefined;
  const now = nowIso();
  return {
    id: generateId('service-route'),
    organizationId,
    createdAt: now,
    updatedAt: now,
    serviceName: target.serviceName,
    endpoint: target.endpoint,
    operation: target.operation,
    priority: 1,
    rationale: `Intent type "${intentType}" maps to the ${target.serviceName} service.`,
  };
}

function workflowRouteFor(intentType: string, organizationId: string): WorkflowRoute | undefined {
  if (intentType !== 'workflow' && intentType !== 'automation') return undefined;
  const now = nowIso();
  return {
    id: generateId('workflow-route'),
    organizationId,
    createdAt: now,
    updatedAt: now,
    workflowDefinitionId: generateId('workflow-definition'),
    trigger: intentType === 'automation' ? 'automation_requested' : 'manual_request',
    confidence: '0.70',
    rationale: `Intent type "${intentType}" maps to a workflow route.`,
  };
}

function missionRouteFor(intentType: string, organizationId: string): MissionRoute | undefined {
  if (intentType !== 'mission' && intentType !== 'collaboration') return undefined;
  const now = nowIso();
  return {
    id: generateId('mission-route'),
    organizationId,
    createdAt: now,
    updatedAt: now,
    missionType: intentType,
    confidence: '0.70',
    rationale: `Intent type "${intentType}" maps to a multi-agent mission route.`,
  };
}

/** Creates a deterministic {@link PlatformRouter}. */
export function createPlatformRouter(deps: PlatformRouterDeps = {}): PlatformRouter {
  return {
    async route(input: RoutingInput): Promise<RoutingDecision> {
      const { organizationId, reasoningResult } = input;
      const intentType = reasoningResult.intentType;

      const workerRoute = await resolveWorkerRoute(organizationId, intentType, deps.agentRegistry);
      const missionRoute = missionRouteFor(intentType, organizationId);
      const workflowRoute = workflowRouteFor(intentType, organizationId);
      const serviceRoute = serviceRouteFor(intentType, organizationId);

      return {
        organizationId,
        serviceRoutes: serviceRoute ? [serviceRoute] : [],
        workflowRoutes: workflowRoute ? [workflowRoute] : [],
        missionRoutes: missionRoute ? [missionRoute] : [],
        workerRoutes: [workerRoute],
      };
    },
  };
}
