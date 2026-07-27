/**
 * Governance Runtime — the package's composition root. Wires every
 * real in-memory repository and service together: Governance Policies,
 * AI Governance, Model Governance, Agent Governance (composed with AI
 * Runtime's agent registry), Workflow Governance (composed with
 * Workflow Engine's queries), the Human Approval Engine (composed with
 * Decision Tracking), Risk Governance, Decision Tracking, the
 * Governance Rules Engine, the Relationship Layer (AI Security Engine,
 * AI Runtime, AI Brain, Workflow Engine, Business DNA, Communication
 * Hub), the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link GovernanceRuntime} surface.
 *
 * @module runtime
 */
import { createAgentGovernanceRecordRepository, createAgentGovernanceService, type AgentGovernanceService, type AgentRuntimeRegistryPort } from './agent-governance/index.js';
import { createAiGovernanceRecordRepository, createAiGovernanceService, type AiGovernanceService } from './ai-governance/index.js';
import { createApprovalEngine, createApprovalRequestRepository, createGovernanceExceptionRepository, type ApprovalEngine } from './approval/index.js';
import { createDecisionRepository, createDecisionTrackingService, type DecisionTrackingService } from './decision/index.js';
import { createGovernanceEventBus, type GovernanceEventBus } from './events/index.js';
import { createModelGovernanceRecordRepository, createModelGovernanceService, type ModelGovernanceService } from './model-governance/index.js';
import { createGovernancePolicyEngine, createGovernancePolicyRepository, createGovernancePolicyVersionRepository, type GovernancePolicyEngine } from './policy/index.js';
import { createGovernanceQueries, type GovernanceQueries } from './queries/index.js';
import { createRelationshipManagement, type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';
import { createRiskRegister, createRiskRepository, type RiskRegister } from './risk/index.js';
import { createGovernanceRuleRepository, createGovernanceRulesEngine, type GovernanceRulesEngine } from './rules-engine/index.js';
import { nowIso } from './shared/id.js';
import { createWorkflowGovernanceRecordRepository, createWorkflowGovernanceService, type WorkflowGovernanceService, type WorkflowRuntimeQueriesPort } from './workflow-governance/index.js';

export interface GovernanceRuntimeDeps {
  readonly eventBus?: GovernanceEventBus;
  readonly now?: () => string;
  readonly aiSecurity?: RelationshipManagementDeps['aiSecurity'];
  readonly aiRuntime?: RelationshipManagementDeps['aiRuntime'];
  readonly aiBrain?: RelationshipManagementDeps['aiBrain'];
  readonly workflow?: RelationshipManagementDeps['workflow'];
  readonly businessDna?: RelationshipManagementDeps['businessDna'];
  readonly communicationHub?: RelationshipManagementDeps['communicationHub'];
  /** Real AI Runtime agent registry — powers Agent Governance's `isAgentRegisteredInRuntime()`. */
  readonly agentRuntimeRegistry?: AgentRuntimeRegistryPort;
  /** Real Workflow Engine queries — powers Workflow Governance's `checkExecutionPolicy()`. */
  readonly workflowQueries?: WorkflowRuntimeQueriesPort;
}

export interface GovernanceRuntime {
  readonly policies: GovernancePolicyEngine;
  readonly aiGovernance: AiGovernanceService;
  readonly modelGovernance: ModelGovernanceService;
  readonly agentGovernance: AgentGovernanceService;
  readonly workflowGovernance: WorkflowGovernanceService;
  readonly approvals: ApprovalEngine;
  readonly risks: RiskRegister;
  readonly decisions: DecisionTrackingService;
  readonly rules: GovernanceRulesEngine;
  readonly relationships: RelationshipManagement;
  readonly queries: GovernanceQueries;
  /** Typed event bus — subscribe to policy/approval/risk/violation/audit events. */
  readonly events: GovernanceEventBus;
}

/** Creates a real, in-memory {@link GovernanceRuntime}. */
export function createGovernanceRuntime(deps: GovernanceRuntimeDeps = {}): GovernanceRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createGovernanceEventBus();

  const policyRepository = createGovernancePolicyRepository();
  const policyVersionRepository = createGovernancePolicyVersionRepository();
  const aiGovernanceRecordRepository = createAiGovernanceRecordRepository();
  const modelGovernanceRecordRepository = createModelGovernanceRecordRepository();
  const agentGovernanceRecordRepository = createAgentGovernanceRecordRepository();
  const workflowGovernanceRecordRepository = createWorkflowGovernanceRecordRepository();
  const approvalRequestRepository = createApprovalRequestRepository();
  const exceptionRepository = createGovernanceExceptionRepository();
  const riskRepository = createRiskRepository();
  const decisionRepository = createDecisionRepository();
  const ruleRepository = createGovernanceRuleRepository();

  const policies = createGovernancePolicyEngine(policyRepository, policyVersionRepository, eventBus, now);
  const aiGovernance = createAiGovernanceService(aiGovernanceRecordRepository, now);
  const modelGovernance = createModelGovernanceService(modelGovernanceRecordRepository, now);
  const agentGovernance = createAgentGovernanceService(agentGovernanceRecordRepository, { aiRuntime: deps.agentRuntimeRegistry }, now);
  const workflowGovernance = createWorkflowGovernanceService(workflowGovernanceRecordRepository, { workflow: deps.workflowQueries }, now);
  const decisions = createDecisionTrackingService(decisionRepository, eventBus, now);
  const approvals = createApprovalEngine(approvalRequestRepository, exceptionRepository, decisions, eventBus, now);
  const risks = createRiskRegister(riskRepository, eventBus, now);
  const rules = createGovernanceRulesEngine(ruleRepository, eventBus, now);

  const relationships = createRelationshipManagement({
    aiSecurity: deps.aiSecurity,
    aiRuntime: deps.aiRuntime,
    aiBrain: deps.aiBrain,
    workflow: deps.workflow,
    businessDna: deps.businessDna,
    communicationHub: deps.communicationHub,
  });

  const queries = createGovernanceQueries({
    policyRepository,
    policyVersionRepository,
    approvalRequestRepository,
    exceptionRepository,
    riskRepository,
    decisionRepository,
    ruleRepository,
  });

  return {
    policies,
    aiGovernance,
    modelGovernance,
    agentGovernance,
    workflowGovernance,
    approvals,
    risks,
    decisions,
    rules,
    relationships,
    queries,
    events: eventBus,
  };
}
