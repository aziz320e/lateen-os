/**
 * Real Workflow Integration service — generates deterministic workflow
 * requests for campaign approval, asset review, publishing, and
 * follow-up by composing the Workflow Engine's public runtime API
 * (`defineWorkflow` + `startWorkflow`) only. Never touches a Workflow
 * Engine repository.
 *
 * The Workflow Engine collaborator is optional: with it injected, every
 * generated request is backed by a real workflow instance; without it,
 * the request is still recorded, just with no workflow linkage, keeping
 * the Marketing Engine fully usable offline.
 *
 * @module workflow-integration/service.impl
 */
import type { HumanTask, WorkflowRuntime } from '@lateen-os/workflow-engine';
import type { MarketingEventBus } from '../events/marketing-event-bus.js';
import { InvalidWorkflowRequestTransitionError, WorkflowRequestNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CampaignId, OrganizationId, WorkflowRequestId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { WorkflowRequestRepository } from './repository.js';
import type { MarketingWorkflowType, WorkflowRequest } from './types.js';

/** Real, optionally-injected Workflow Engine collaborator — only the two composition-root operations this module needs. */
export interface WorkflowIntegrationDeps {
  readonly workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>;
}

/** Matches Workflow Engine's `WorkflowCategory` union members used by Workflow Integration. */
type MarketingWorkflowCategory = 'approval' | 'operational';

interface RequestWorkflowConfig {
  readonly code: string;
  readonly name: string;
  readonly category: MarketingWorkflowCategory;
}

const REQUEST_WORKFLOW_CONFIG: Readonly<Record<MarketingWorkflowType, RequestWorkflowConfig>> = {
  campaign_approval: { code: 'marketing.campaign-approval', name: 'Campaign Approval', category: 'approval' },
  asset_review: { code: 'marketing.asset-review', name: 'Asset Review', category: 'approval' },
  publishing: { code: 'marketing.publishing', name: 'Publishing', category: 'operational' },
  follow_up: { code: 'marketing.follow-up', name: 'Follow-up', category: 'operational' },
};

export interface GenerateWorkflowRequestInput {
  readonly requestType: MarketingWorkflowType;
  readonly campaignId: CampaignId;
  readonly notes?: string;
  readonly dueAt?: ISODateTime;
}

export interface CompleteWorkflowRequestOutcome {
  /** Only meaningful for `requestType === 'campaign_approval'`. */
  readonly approved?: boolean;
}

export interface WorkflowIntegrationService {
  /** Records a request and, if a Workflow Engine collaborator was injected, starts a real backing workflow instance for it. */
  generateRequest(organizationId: OrganizationId, input: GenerateWorkflowRequestInput): Promise<WorkflowRequest>;
  completeRequest(organizationId: OrganizationId, requestId: WorkflowRequestId, outcome?: CompleteWorkflowRequestOutcome): Promise<WorkflowRequest>;
  cancelRequest(organizationId: OrganizationId, requestId: WorkflowRequestId): Promise<WorkflowRequest>;
  get(organizationId: OrganizationId, requestId: WorkflowRequestId): Promise<WorkflowRequest | null>;
  listByCampaign(organizationId: OrganizationId, campaignId: CampaignId): Promise<readonly WorkflowRequest[]>;
}

/** Creates a real {@link WorkflowIntegrationService} backed by a {@link WorkflowRequestRepository} and an optional Workflow Engine collaborator. */
export function createWorkflowIntegrationService(
  repository: WorkflowRequestRepository,
  deps: WorkflowIntegrationDeps = {},
  eventBus?: MarketingEventBus,
  now: () => string = nowIso,
): WorkflowIntegrationService {
  /** Idempotent per (organization, request type) — defines the canonical single-step workflow at most once. */
  const definitionCache = new Map<string, string>();

  async function ensureWorkflowDefinitionId(organizationId: OrganizationId, requestType: MarketingWorkflowType): Promise<string | undefined> {
    if (!deps.workflow) return undefined;
    const cacheKey = `${organizationId}::${requestType}`;
    const cached = definitionCache.get(cacheKey);
    if (cached) return cached;

    const config = REQUEST_WORKFLOW_CONFIG[requestType];
    const step: HumanTask = {
      stepId: generateId('workflow-step'),
      code: config.code,
      name: config.name,
      type: 'human',
      optional: false,
    };
    const { definition } = await deps.workflow.defineWorkflow({
      organizationId,
      code: config.code,
      name: config.name,
      metadata: { category: config.category },
      version: '1.0.0',
      steps: [step],
      transitions: [],
    });
    definitionCache.set(cacheKey, definition.id);
    return definition.id;
  }

  async function requireRequest(organizationId: OrganizationId, requestId: WorkflowRequestId): Promise<WorkflowRequest> {
    const request = await repository.findById(organizationId, requestId);
    if (!request) throw new WorkflowRequestNotFoundError(requestId);
    return request;
  }

  return {
    async generateRequest(organizationId, input) {
      const timestamp = now();
      const workflowDefinitionId = await ensureWorkflowDefinitionId(organizationId, input.requestType);

      let workflowInstanceId: string | undefined;
      if (deps.workflow && workflowDefinitionId) {
        const instance = await deps.workflow.startWorkflow({
          organizationId,
          definitionId: workflowDefinitionId,
          variables: { campaignId: input.campaignId, notes: input.notes, dueAt: input.dueAt },
        });
        workflowInstanceId = instance.id;
      }

      const request: WorkflowRequest = {
        id: generateId('workflow-request'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        requestType: input.requestType,
        campaignId: input.campaignId,
        status: 'pending',
        notes: input.notes,
        dueAt: input.dueAt,
        workflowDefinitionId,
        workflowInstanceId,
      };
      await repository.save(request);
      eventBus?.publish('workflow.requested', { workflowRequestId: request.id, organizationId, requestType: request.requestType });
      return request;
    },

    async completeRequest(organizationId, requestId, outcome) {
      const request = await requireRequest(organizationId, requestId);
      if (request.status !== 'pending') {
        throw new InvalidWorkflowRequestTransitionError(requestId, request.status, 'completed');
      }
      const updated: WorkflowRequest = {
        ...request,
        status: 'completed',
        approved: outcome?.approved,
        completedAt: now(),
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async cancelRequest(organizationId, requestId) {
      const request = await requireRequest(organizationId, requestId);
      if (request.status !== 'pending') {
        throw new InvalidWorkflowRequestTransitionError(requestId, request.status, 'cancelled');
      }
      const updated: WorkflowRequest = { ...request, status: 'cancelled', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, requestId) {
      return repository.findById(organizationId, requestId);
    },

    async listByCampaign(organizationId, campaignId) {
      return repository.findByCampaign(organizationId, campaignId);
    },
  };
}
