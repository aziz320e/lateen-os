/**
 * @lateen-os/ai-security-engine — AI Security Engine
 *
 * Identity, authentication, authorization, secrets, provider/prompt/
 * tool security, data security, threat detection, and audit for
 * Lateen OS. Real, deterministic, offline implementation — see
 * `runtime.ts`'s `createSecurityRuntime()` for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as identity from './identity/index.js';
export * as authentication from './authentication/index.js';
export * as authorization from './authorization/index.js';
export * as secrets from './secrets/index.js';
export * as providerSecurity from './provider-security/index.js';
export * as promptSecurity from './prompt-security/index.js';
export * as toolSecurity from './tool-security/index.js';
export * as dataSecurity from './data-security/index.js';
export * as threatDetection from './threat-detection/index.js';
export * as audit from './audit/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createSecurityRuntime,
  type SecurityRuntime,
  type SecurityRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { Identity, IdentityType, IdentityStatus, IdentityId } from './identity/types.js';
export type { Role, RoleStatus, Policy, PolicyType, PolicyEffect, PolicyStatus, PolicyRule, AuthorizeRequest, AuthorizeResult, RoleId, PolicyId } from './authorization/types.js';
export type { Secret, SecretType, SecretStatus, SecretId } from './secrets/types.js';
export type { ProviderSecurityPolicy, ProviderPolicyStatus, EvaluateProviderRequest, ProviderRequestEvaluation, ProviderPolicyId } from './provider-security/types.js';
export type { ToolPolicy, ToolPolicyStatus, ToolExecutionEvaluation, ToolPolicyId } from './tool-security/types.js';
export type { PiiType, PiiMatch, DataClassification, RetentionRule, RetentionRuleId } from './data-security/types.js';
export type { Threat, ThreatType, ThreatSeverity, ThreatId } from './threat-detection/types.js';
export type { AuditEvent, AuditCategory, AuditOutcome, AuditEventId } from './audit/types.js';

/** Real lifecycle/service ports. */
export {
  type IdentityService,
  type CreatePrincipalInput,
  type CreateSecretIdentityInput,
  type IssuedSecretIdentity,
} from './identity/service.impl.js';
export { type AuthenticationService } from './authentication/service.impl.js';
export {
  type AuthorizationService,
  type CreateRoleInput,
  type CreatePolicyInput,
  type UpdatePolicyInput,
} from './authorization/service.impl.js';
export { type SecretsService, type CreateSecretInput, type RotateSecretInput } from './secrets/service.impl.js';
export {
  type ProviderSecurityService,
  type ProviderSecurityDeps,
  type CreateProviderPolicyInput,
} from './provider-security/service.impl.js';
export { type PromptSecurityService, type AuditPromptInput } from './prompt-security/service.impl.js';
export {
  type ToolSecurityService,
  type ToolSecurityDeps,
  type CreateToolPolicyInput,
} from './tool-security/service.impl.js';
export { type DataSecurityService, type CreateRetentionRuleInput } from './data-security/engine.impl.js';
export {
  type ThreatDetectionEngine,
  type ScanPromptInput,
  type CheckToolAbuseInput,
  type CheckRateAbuseInput,
} from './threat-detection/engine.impl.js';
export { type AuditService, type RecordAuditEventInput } from './audit/service.impl.js';

/** Pure, deterministic functions — independently testable, no dependencies. */
export {
  generateRandomToken,
  hashValue,
  generateEncryptionKey,
  encryptValue,
  decryptValue,
  signHmac,
  verifyHmac,
  type EncryptedValue,
  type RandomBytesFn,
} from './shared/crypto.js';
export { detectPromptInjection, detectJailbreak, detectSecretLeakage, detectToolAbuse, detectRateAbuse } from './threat-detection/engine.impl.js';
export { detectPii, classifyData, maskText, redactText, isRetentionExpired } from './data-security/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { IdentityRepository } from './identity/repository.js';
export type { RoleRepository, PolicyRepository, RoleAssignmentRepository } from './authorization/repository.js';
export type { SecretRepository } from './secrets/repository.js';
export type { ProviderSecurityPolicyRepository } from './provider-security/repository.js';
export type { ToolPolicyRepository } from './tool-security/repository.js';
export type { RetentionRuleRepository } from './data-security/repository.js';
export type { ThreatRepository } from './threat-detection/repository.js';
export type { AuditEventRepository } from './audit/repository.js';

/** Relationship Layer (AI Brain / Workflow Engine / Communication Hub / Business DNA integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { SecurityQueries } from './queries/security-queries.js';

/** Typed event bus. */
export type { SecurityDomainEvent } from './events/security-events.js';
export { SECURITY_EVENT_NAMES } from './events/security-events.js';
