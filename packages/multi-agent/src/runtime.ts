/**
 * Multi-Agent Runtime — the package's composition root. Wires every real
 * in-memory repository and service together: Agent Registry/Directory/
 * Discovery/Groups, Agent Sessions, the Communication Bus (+ Message
 * Routing), Delegation, Shared Context, Shared Working Memory, Conflict
 * Detection/Resolution, Coordination Policies, Teams, the real
 * Collaboration Orchestrator, the query layer, and the event bus.
 *
 * Integrates with:
 * - AI Runtime — `registerAgent()` cross-validates against a real, injected
 *   `AgentRegistryService.getRegistry()` when the descriptor references a
 *   `runtimeAgentId`.
 * - AI Brain — the Escalation service consults a real, injected
 *   `Brain.process()` for `'ceo_ai'`-level escalations.
 * - Workflow Engine — the Collaboration Orchestrator starts a real
 *   `WorkflowRuntime` instance when advancing a coordination step, if
 *   injected.
 * - Shared Kernel — every repository is `createInMemoryRepository`; the
 *   event bus is `createEventBus`.
 *
 * @module runtime
 */
import type { AgentRegistryService, RuntimeAgentId } from '@lateen-os/ai-runtime';
import type { Brain } from '@lateen-os/ai-brain';
import type { WorkflowDefinitionId, WorkflowRuntime } from '@lateen-os/workflow-engine';
import {
  createAgentDirectory,
  createAgentDiscovery,
  createAgentGroupRepository,
  createAgentGroupService,
  createAgentRegistrationRepository,
  createAgentRegistry,
  type AgentDescriptor,
  type AgentDirectory,
  type AgentDiscovery,
  type AgentGroupService,
  type AgentRegistration,
  type AgentRegistry,
} from './agent/index.js';
import {
  createAgentSessionRepository,
  createAgentSessionService,
  type AgentSessionService,
} from './session/index.js';
import {
  createSharedWorkingMemoryRepository,
  createSharedWorkingMemoryService,
  type SharedWorkingMemoryService,
} from './working-memory/index.js';
import {
  createCommunicationBus,
  createConversationRepository,
  createDecisionProposalRepository,
  createDiscussionRepository,
  createMessageRepository,
  type CommunicationBus,
} from './conversation/index.js';
import {
  createDelegationPolicyRepository,
  createDelegationRequestRepository,
  createDelegationService,
  type DelegationService,
} from './delegation/index.js';
import {
  createNegotiationRepository,
  createNegotiationRoundRepository,
  createNegotiationService,
  type NegotiationService,
} from './negotiation/index.js';
import {
  createAgreementRepository,
  createConsensusResultRepository,
  createConsensusService,
  type ConsensusService,
} from './consensus/index.js';
import { createReviewCommentRepository, createReviewRequestRepository, createReviewService, type ReviewService } from './review/index.js';
import {
  createEscalationDecisionRepository,
  createEscalationRequestRepository,
  createEscalationService,
  type EscalationService,
} from './escalation/index.js';
import {
  createCoordinationPlanRepository,
  createCoordinationPolicyRepository,
  createCoordinationPolicyService,
  createCoordinationStepRepository,
  createCoordinatorRepository,
  createCollaborationOrchestrator,
  type CoordinationPolicyService,
} from './coordination/index.js';
import type { CollaborationOrchestrator, CoordinationStep } from './coordination/types.js';
import {
  createSharedBusinessContextRepository,
  createSharedContextService,
  createSharedDecisionReferenceRepository,
  createSharedMemoryReferenceRepository,
  type SharedContextService,
} from './shared-context/index.js';
import { createExecutionService, createExecutionStageRepository, createMissionExecutionRepository, type ExecutionService } from './execution/index.js';
import { createMissionMemberRepository, createMissionTeamRepository, createTeamService, type TeamService } from './team/index.js';
import { createMissionLifecycle, createMissionRepository, type MissionLifecycle } from './mission/index.js';
import { createConflictDetector, createConflictRepository, createConflictResolver, type ConflictDetector, type ConflictResolver } from './conflict/index.js';
import { createCollaborationQueries, type CollaborationQueries } from './queries/index.js';
import { createCollaborationEventBus, type CollaborationEventBus } from './events/index.js';
import { AgentNotRegisteredError } from './shared/errors.js';
import type { OrganizationId } from './shared/identifiers.js';

export interface MultiAgentRuntimeDeps {
  /** Real ai-runtime collaborator — cross-validates agent registrations that reference a runtimeAgentId. */
  readonly runtimeAgentRegistry?: Pick<AgentRegistryService, 'getRegistry'>;
  /** Real ai-brain collaborator — consulted by Escalation for 'ceo_ai'-level requests. */
  readonly brain?: Pick<Brain, 'process'>;
  /** Real workflow-engine collaborator — started by the orchestrator when advancing a coordination step. */
  readonly workflowRuntime?: Pick<WorkflowRuntime, 'startWorkflow'>;
  readonly workflowDefinitionIdForStep?: (step: CoordinationStep) => WorkflowDefinitionId | undefined;
  readonly eventBus?: CollaborationEventBus;
  readonly now?: () => string;
}

export interface MultiAgentRuntime {
  readonly agentRegistry: AgentRegistry;
  readonly agentDirectory: AgentDirectory;
  readonly agentDiscovery: AgentDiscovery;
  readonly agentGroups: AgentGroupService;
  readonly sessions: AgentSessionService;
  readonly workingMemory: SharedWorkingMemoryService;
  readonly communicationBus: CommunicationBus;
  readonly delegation: DelegationService;
  readonly negotiation: NegotiationService;
  readonly consensus: ConsensusService;
  readonly review: ReviewService;
  readonly escalation: EscalationService;
  readonly coordinationPolicies: CoordinationPolicyService;
  readonly orchestrator: CollaborationOrchestrator;
  readonly sharedContext: SharedContextService;
  readonly execution: ExecutionService;
  readonly team: TeamService;
  readonly missions: MissionLifecycle;
  readonly conflictDetector: ConflictDetector;
  readonly conflictResolver: ConflictResolver;
  readonly queries: CollaborationQueries;
  readonly eventBus: CollaborationEventBus;
  /**
   * Registers an agent for collaboration. When the descriptor references a
   * `runtimeAgentId` and a real ai-runtime `AgentRegistryService` was
   * injected, genuinely calls `getRegistry()` to confirm that runtime
   * agent is actually registered there — throws {@link AgentNotRegisteredError}
   * if it references one that doesn't exist.
   */
  registerAgent(organizationId: OrganizationId, descriptor: AgentDescriptor): Promise<AgentRegistration>;
}

/** Creates a real, in-memory {@link MultiAgentRuntime}. */
export function createMultiAgentRuntime(deps: MultiAgentRuntimeDeps = {}): MultiAgentRuntime {
  const eventBus = deps.eventBus ?? createCollaborationEventBus();

  const agentRegistrationRepository = createAgentRegistrationRepository();
  const agentGroupRepository = createAgentGroupRepository();
  const sessionRepository = createAgentSessionRepository();
  const workingMemoryRepository = createSharedWorkingMemoryRepository();
  const conversationRepository = createConversationRepository();
  const messageRepository = createMessageRepository();
  const discussionRepository = createDiscussionRepository();
  const proposalRepository = createDecisionProposalRepository();
  const delegationRequestRepository = createDelegationRequestRepository();
  const delegationPolicyRepository = createDelegationPolicyRepository();
  const negotiationRepository = createNegotiationRepository();
  const negotiationRoundRepository = createNegotiationRoundRepository();
  const consensusResultRepository = createConsensusResultRepository();
  const agreementRepository = createAgreementRepository();
  const reviewRequestRepository = createReviewRequestRepository();
  const reviewCommentRepository = createReviewCommentRepository();
  const escalationRequestRepository = createEscalationRequestRepository();
  const escalationDecisionRepository = createEscalationDecisionRepository();
  const coordinatorRepository = createCoordinatorRepository();
  const coordinationPlanRepository = createCoordinationPlanRepository();
  const coordinationStepRepository = createCoordinationStepRepository();
  const coordinationPolicyRepository = createCoordinationPolicyRepository();
  const sharedContextRepository = createSharedBusinessContextRepository();
  const memoryReferenceRepository = createSharedMemoryReferenceRepository();
  const decisionReferenceRepository = createSharedDecisionReferenceRepository();
  const executionRepository = createMissionExecutionRepository();
  const stageRepository = createExecutionStageRepository();
  const teamRepository = createMissionTeamRepository();
  const memberRepository = createMissionMemberRepository();
  const missionRepository = createMissionRepository();
  const conflictRepository = createConflictRepository();

  const agentRegistry = createAgentRegistry(agentRegistrationRepository, eventBus);
  const agentDirectory = createAgentDirectory(agentRegistry);
  const agentDiscovery = createAgentDiscovery(agentDirectory);
  const agentGroups = createAgentGroupService(agentGroupRepository);
  const sessions = createAgentSessionService(sessionRepository, eventBus);
  const workingMemory = createSharedWorkingMemoryService(workingMemoryRepository);
  const communicationBus = createCommunicationBus(conversationRepository, messageRepository, discussionRepository, proposalRepository, eventBus);
  const delegation = createDelegationService(delegationRequestRepository, delegationPolicyRepository, eventBus);
  const negotiation = createNegotiationService(negotiationRepository, negotiationRoundRepository);
  const consensus = createConsensusService(consensusResultRepository, agreementRepository, eventBus);
  const review = createReviewService(reviewRequestRepository, reviewCommentRepository);
  const escalation = createEscalationService({ requestRepository: escalationRequestRepository, decisionRepository: escalationDecisionRepository, brain: deps.brain });
  const coordinationPolicies = createCoordinationPolicyService(coordinationPolicyRepository);
  const sharedContext = createSharedContextService(sharedContextRepository, memoryReferenceRepository, decisionReferenceRepository);
  const execution = createExecutionService(executionRepository, stageRepository);
  const team = createTeamService(teamRepository, memberRepository);
  const missions = createMissionLifecycle(missionRepository, eventBus);
  const conflictDetector = createConflictDetector(proposalRepository, conflictRepository, eventBus);
  const conflictResolver = createConflictResolver(conflictRepository, proposalRepository, escalation, eventBus);

  const orchestrator = createCollaborationOrchestrator({
    coordinatorRepository,
    planRepository: coordinationPlanRepository,
    stepRepository: coordinationStepRepository,
    teamRepository,
    memberRepository,
    missionLifecycle: missions,
    escalationService: escalation,
    executionService: execution,
    workflowRuntime: deps.workflowRuntime,
    workflowDefinitionIdForStep: deps.workflowDefinitionIdForStep,
    eventBus,
    now: deps.now,
  });

  const queries = createCollaborationQueries({
    missionRepository,
    teamRepository,
    negotiationRepository,
    reviewRequestRepository,
    consensusResultRepository,
    agentRegistrationRepository,
    conflictRepository,
    workingMemoryRepository,
    sessionRepository,
    coordinationPlanRepository,
    coordinationStepRepository,
  });

  return {
    agentRegistry,
    agentDirectory,
    agentDiscovery,
    agentGroups,
    sessions,
    workingMemory,
    communicationBus,
    delegation,
    negotiation,
    consensus,
    review,
    escalation,
    coordinationPolicies,
    orchestrator,
    sharedContext,
    execution,
    team,
    missions,
    conflictDetector,
    conflictResolver,
    queries,
    eventBus,

    async registerAgent(organizationId, descriptor) {
      if (descriptor.runtimeAgentId && deps.runtimeAgentRegistry) {
        const runtimeRegistry = await deps.runtimeAgentRegistry.getRegistry(organizationId);
        const isRegisteredInRuntime = runtimeRegistry.registrations.some(
          (registration) => registration.descriptor.runtimeAgentId === (descriptor.runtimeAgentId as RuntimeAgentId),
        );
        if (!isRegisteredInRuntime) {
          throw new AgentNotRegisteredError(String(descriptor.runtimeAgentId));
        }
      }
      const registration = await agentRegistry.register(organizationId, descriptor);
      eventBus.publish('agent.registered', { workerId: descriptor.workerId, role: descriptor.role });
      return registration;
    },
  };
}
