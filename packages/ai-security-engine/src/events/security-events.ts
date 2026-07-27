/** @module events/security-events */
import type { DomainEvent, DomainEventName } from '@lateen-os/shared-kernel/core';

export type AuthenticationEventName = DomainEventName<'authentication', 'failed'>;

export type AuthenticationDomainEvent = DomainEvent<
  'authentication.failed',
  { readonly organizationId: string; readonly reason: string }
>;

export type AuthorizationEventName = DomainEventName<'authorization', 'denied'>;

export type AuthorizationDomainEvent = DomainEvent<
  'authorization.denied',
  { readonly organizationId: string; readonly identityId: string; readonly permission: string; readonly reason: string }
>;

export type SecretEventName = DomainEventName<'secret', 'rotated'>;

export type SecretDomainEvent = DomainEvent<'secret.rotated', { readonly secretId: string; readonly organizationId: string }>;

export type PromptEventName = DomainEventName<'prompt', 'attack.detected'>;

export type PromptDomainEvent = DomainEvent<
  'prompt.attack.detected',
  { readonly organizationId: string; readonly threatId: string; readonly threatType: string }
>;

export type ToolEventName = DomainEventName<'tool', 'blocked'>;

export type ToolDomainEvent = DomainEvent<
  'tool.blocked',
  { readonly organizationId: string; readonly toolId: string; readonly reason: string }
>;

export type ProviderEventName = DomainEventName<'provider', 'blocked'>;

export type ProviderDomainEvent = DomainEvent<
  'provider.blocked',
  { readonly organizationId: string; readonly providerKind: string; readonly reason: string }
>;

export type PolicyEventName = DomainEventName<'policy', 'updated'>;

export type PolicyDomainEvent = DomainEvent<'policy.updated', { readonly policyId: string; readonly organizationId: string }>;

export type AuditEventName = DomainEventName<'audit', 'created'>;

export type AuditDomainEvent = DomainEvent<
  'audit.created',
  { readonly auditEventId: string; readonly organizationId: string; readonly category: string }
>;

/** Canonical event names for external subscribers. */
export const SECURITY_EVENT_NAMES = {
  AuthenticationFailed: 'authentication.failed',
  AuthorizationDenied: 'authorization.denied',
  SecretRotated: 'secret.rotated',
  PromptAttackDetected: 'prompt.attack.detected',
  ToolBlocked: 'tool.blocked',
  ProviderBlocked: 'provider.blocked',
  PolicyUpdated: 'policy.updated',
  AuditCreated: 'audit.created',
} as const;

/** Union of all AI Security Engine domain events. */
export type SecurityDomainEvent =
  | AuthenticationDomainEvent
  | AuthorizationDomainEvent
  | SecretDomainEvent
  | PromptDomainEvent
  | ToolDomainEvent
  | ProviderDomainEvent
  | PolicyDomainEvent
  | AuditDomainEvent;
