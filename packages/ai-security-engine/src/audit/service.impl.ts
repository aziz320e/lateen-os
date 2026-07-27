/**
 * Real Audit service — the single, shared audit sink composed by every
 * other security subsystem in this package. Supports Security Audit
 * Log (the full stream), Access History (authentication +
 * authorization entries), and Policy History (policy entries) as
 * filtered views over the same immutable event stream.
 *
 * @module audit/service.impl
 */
import type { SecurityEventBus } from '../events/security-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { AuditEventRepository } from './repository.js';
import type { AuditCategory, AuditEvent, AuditOutcome } from './types.js';

export interface RecordAuditEventInput {
  readonly category: AuditCategory;
  readonly action: string;
  readonly actorId?: string;
  readonly outcome: AuditOutcome;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface AuditService {
  record(organizationId: OrganizationId, input: RecordAuditEventInput): Promise<AuditEvent>;
  findAll(organizationId: OrganizationId): Promise<readonly AuditEvent[]>;
  findByCategory(organizationId: OrganizationId, category: AuditCategory): Promise<readonly AuditEvent[]>;
  findByActor(organizationId: OrganizationId, actorId: string): Promise<readonly AuditEvent[]>;
  /** Every `authentication` or `authorization` entry — the Access History view. */
  findAccessHistory(organizationId: OrganizationId): Promise<readonly AuditEvent[]>;
  /** Every `policy` entry — the Policy History view. */
  findPolicyHistory(organizationId: OrganizationId): Promise<readonly AuditEvent[]>;
  /** Every entry whose outcome is not `'success'` — the Violations view. */
  findViolations(organizationId: OrganizationId): Promise<readonly AuditEvent[]>;
}

/** Creates a real {@link AuditService} backed by an {@link AuditEventRepository}. */
export function createAuditService(
  repository: AuditEventRepository,
  eventBus?: SecurityEventBus,
  now: () => string = nowIso,
): AuditService {
  return {
    async record(organizationId, input) {
      const event: AuditEvent = {
        id: generateId('audit-event'),
        organizationId,
        category: input.category,
        action: input.action,
        actorId: input.actorId,
        outcome: input.outcome,
        details: input.details,
        occurredAt: now(),
      };
      await repository.save(event);
      eventBus?.publish('audit.created', { auditEventId: event.id, organizationId, category: event.category });
      return event;
    },

    async findAll(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByCategory(organizationId, category) {
      return repository.findByCategory(organizationId, category);
    },

    async findByActor(organizationId, actorId) {
      return repository.findByActor(organizationId, actorId);
    },

    async findAccessHistory(organizationId) {
      const all = await repository.findAll(organizationId);
      return all.filter((event) => event.category === 'authentication' || event.category === 'authorization');
    },

    async findPolicyHistory(organizationId) {
      return repository.findByCategory(organizationId, 'policy');
    },

    async findViolations(organizationId) {
      const all = await repository.findAll(organizationId);
      return all.filter((event) => event.outcome !== 'success');
    },
  };
}
