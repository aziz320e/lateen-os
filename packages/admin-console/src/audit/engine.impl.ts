/**
 * Real Audit Center — an immutable, append-only audit timeline.
 * There is no update or delete on this engine's public surface.
 *
 * @module audit/engine.impl
 */
import type { AdminEventBus } from '../events/admin-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AuditEntryId, OrganizationId } from '../shared/identifiers.js';
import type { AuditEntryRepository } from './repository.js';
import type { AuditActor, AuditEntry, AuditTarget } from './types.js';

export interface RecordAuditInput {
  readonly actor: AuditActor;
  readonly action: string;
  readonly target: AuditTarget;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AuditCenterEngine {
  recordAudit(organizationId: OrganizationId, input: RecordAuditInput): Promise<AuditEntry>;
  getAudit(organizationId: OrganizationId, auditEntryId: AuditEntryId): Promise<AuditEntry | null>;
  findForActor(organizationId: OrganizationId, actorId: string): Promise<readonly AuditEntry[]>;
  findForTarget(organizationId: OrganizationId, targetType: string, targetId: string): Promise<readonly AuditEntry[]>;
  listAudits(organizationId: OrganizationId): Promise<readonly AuditEntry[]>;
}

/** Creates a real {@link AuditCenterEngine}. */
export function createAuditCenterEngine(repository: AuditEntryRepository, eventBus?: AdminEventBus, now: () => string = nowIso): AuditCenterEngine {
  return {
    async recordAudit(organizationId, input) {
      const timestamp = now();
      const entry: AuditEntry = {
        id: generateId('admin-audit'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        actor: input.actor,
        action: input.action,
        target: input.target,
        metadata: input.metadata ?? {},
        recordedAt: timestamp,
      };
      await repository.save(entry);
      eventBus?.publish('audit.recorded', { organizationId, auditEntryId: entry.id, action: entry.action });
      return entry;
    },

    async getAudit(organizationId, auditEntryId) {
      return repository.findById(organizationId, auditEntryId);
    },

    async findForActor(organizationId, actorId) {
      const all = await repository.findAll(organizationId);
      return all.filter((entry) => entry.actor.id === actorId);
    },

    async findForTarget(organizationId, targetType, targetId) {
      const all = await repository.findAll(organizationId);
      return all.filter((entry) => entry.target.type === targetType && entry.target.id === targetId);
    },

    async listAudits(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
