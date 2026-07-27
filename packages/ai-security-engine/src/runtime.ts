/**
 * Security Runtime — the package's composition root. Wires every real
 * in-memory repository and service together: Identity, Authentication,
 * Authorization, Secrets, Provider Security (composed with AI Provider
 * Hub), Prompt Security, Tool Security (composed with AI Runtime), Data
 * Security, Threat Detection, Audit (the shared sink every other
 * subsystem writes to), the Relationship Layer (AI Brain, Workflow
 * Engine, Communication Hub, Business DNA), the query layer, and the
 * typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link SecurityRuntime} surface.
 *
 * @module runtime
 */
import type { ModelRegistry, ProviderRegistry } from '@lateen-os/ai-provider-hub';
import type { ToolExecutionFramework } from '@lateen-os/ai-runtime';
import { createAuditEventRepository, createAuditService, type AuditService } from './audit/index.js';
import { createAuthenticationService, type AuthenticationService } from './authentication/index.js';
import {
  createAuthorizationService,
  createPolicyRepository,
  createRoleAssignmentRepository,
  createRoleRepository,
  type AuthorizationService,
} from './authorization/index.js';
import {
  createDataSecurityService,
  createRetentionRuleRepository,
  type DataSecurityService,
} from './data-security/index.js';
import { createSecurityEventBus, type SecurityEventBus } from './events/index.js';
import { createIdentityRepository, createIdentityService, type IdentityService } from './identity/index.js';
import { createPromptSecurityService, type PromptSecurityService } from './prompt-security/index.js';
import {
  createProviderSecurityPolicyRepository,
  createProviderSecurityService,
  type ProviderSecurityService,
} from './provider-security/index.js';
import { createSecurityQueries, type SecurityQueries } from './queries/index.js';
import {
  createRelationshipManagement,
  type RelationshipManagement,
  type RelationshipManagementDeps,
} from './relationship-management/index.js';
import { createSecretRepository, createSecretsService, type SecretsService } from './secrets/index.js';
import { nowIso } from './shared/id.js';
import {
  createThreatDetectionEngine,
  createThreatRepository,
  type ThreatDetectionEngine,
} from './threat-detection/index.js';
import {
  createToolPolicyRepository,
  createToolSecurityService,
  type ToolSecurityService,
} from './tool-security/index.js';

export interface SecurityRuntimeDeps {
  readonly eventBus?: SecurityEventBus;
  readonly now?: () => string;
  readonly providerRegistry?: Pick<ProviderRegistry, 'findByKind'>;
  readonly modelRegistry?: Pick<ModelRegistry, 'get'>;
  readonly toolExecution?: Pick<ToolExecutionFramework, 'listTools'>;
  readonly aiBrain?: RelationshipManagementDeps['aiBrain'];
  readonly workflow?: RelationshipManagementDeps['workflow'];
  readonly communicationHub?: RelationshipManagementDeps['communicationHub'];
  readonly businessDna?: RelationshipManagementDeps['businessDna'];
}

export interface SecurityRuntime {
  readonly identity: IdentityService;
  readonly authentication: AuthenticationService;
  readonly authorization: AuthorizationService;
  readonly secrets: SecretsService;
  readonly providerSecurity: ProviderSecurityService;
  readonly promptSecurity: PromptSecurityService;
  readonly toolSecurity: ToolSecurityService;
  readonly dataSecurity: DataSecurityService;
  readonly threatDetection: ThreatDetectionEngine;
  readonly audit: AuditService;
  readonly relationships: RelationshipManagement;
  readonly queries: SecurityQueries;
  /** Typed event bus — subscribe to authentication/authorization/secret/prompt/tool/provider/policy/audit events. */
  readonly events: SecurityEventBus;
}

/** Creates a real, in-memory {@link SecurityRuntime}. */
export function createSecurityRuntime(deps: SecurityRuntimeDeps = {}): SecurityRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createSecurityEventBus();

  const auditEventRepository = createAuditEventRepository();
  const identityRepository = createIdentityRepository();
  const roleRepository = createRoleRepository();
  const policyRepository = createPolicyRepository();
  const roleAssignmentRepository = createRoleAssignmentRepository();
  const secretRepository = createSecretRepository();
  const providerPolicyRepository = createProviderSecurityPolicyRepository();
  const toolPolicyRepository = createToolPolicyRepository();
  const retentionRuleRepository = createRetentionRuleRepository();
  const threatRepository = createThreatRepository();

  const audit = createAuditService(auditEventRepository, eventBus, now);
  const identity = createIdentityService(identityRepository, now);
  const authentication = createAuthenticationService(identity, audit, eventBus, now);
  const authorization = createAuthorizationService(roleRepository, policyRepository, roleAssignmentRepository, audit, eventBus, now);
  const secrets = createSecretsService(secretRepository, eventBus, now);
  const providerSecurity = createProviderSecurityService(
    providerPolicyRepository,
    { providerRegistry: deps.providerRegistry, modelRegistry: deps.modelRegistry },
    eventBus,
    now,
  );
  const promptSecurity = createPromptSecurityService(audit);
  const toolSecurity = createToolSecurityService(toolPolicyRepository, { toolExecution: deps.toolExecution }, eventBus, now);
  const dataSecurity = createDataSecurityService(retentionRuleRepository, now);
  const threatDetection = createThreatDetectionEngine(threatRepository, eventBus, now);
  const relationships = createRelationshipManagement({
    aiBrain: deps.aiBrain,
    workflow: deps.workflow,
    communicationHub: deps.communicationHub,
    businessDna: deps.businessDna,
  });

  const queries = createSecurityQueries({
    auditEventRepository,
    threatRepository,
    secretRepository,
    policyRepository,
  });

  return {
    identity,
    authentication,
    authorization,
    secrets,
    providerSecurity,
    promptSecurity,
    toolSecurity,
    dataSecurity,
    threatDetection,
    audit,
    relationships,
    queries,
    events: eventBus,
  };
}
