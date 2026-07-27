/**
 * Real, typed event bus for the AI Security Engine runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/security-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type SecurityEventMap = {
  'authentication.failed': { readonly organizationId: string; readonly reason: string };
  'authorization.denied': { readonly organizationId: string; readonly identityId: string; readonly permission: string; readonly reason: string };
  'secret.rotated': { readonly secretId: string; readonly organizationId: string };
  'prompt.attack.detected': { readonly organizationId: string; readonly threatId: string; readonly threatType: string };
  'tool.blocked': { readonly organizationId: string; readonly toolId: string; readonly reason: string };
  'provider.blocked': { readonly organizationId: string; readonly providerKind: string; readonly reason: string };
  'policy.updated': { readonly policyId: string; readonly organizationId: string };
  'audit.created': { readonly auditEventId: string; readonly organizationId: string; readonly category: string };
};

export type SecurityEventBus = EventBus<SecurityEventMap>;

/** Creates an in-memory {@link SecurityEventBus}. */
export function createSecurityEventBus(): SecurityEventBus {
  return createEventBus<SecurityEventMap>();
}
