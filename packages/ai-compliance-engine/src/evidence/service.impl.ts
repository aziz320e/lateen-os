/**
 * Real Evidence Management service — collection timestamps, attachment
 * metadata (no real file storage), and evidence sources over an
 * immutable, append-only history: the service exposes no update or
 * delete method.
 *
 * @module evidence/service.impl
 */
import type { ComplianceEventBus } from '../events/compliance-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ComplianceControlId, ComplianceFrameworkId, OrganizationId } from '../shared/identifiers.js';
import type { EvidenceRepository } from './repository.js';
import type { EvidenceAttachment, EvidenceRecord, EvidenceSource } from './types.js';

export interface CollectEvidenceInput {
  readonly controlId?: ComplianceControlId;
  readonly frameworkId?: ComplianceFrameworkId;
  readonly source: EvidenceSource;
  readonly description?: string;
  readonly attachments?: readonly Omit<EvidenceAttachment, 'id'>[];
}

export interface EvidenceService {
  collectEvidence(organizationId: OrganizationId, input: CollectEvidenceInput): Promise<EvidenceRecord>;
  get(organizationId: OrganizationId, evidenceId: string): Promise<EvidenceRecord | null>;
  findByControlId(organizationId: OrganizationId, controlId: ComplianceControlId): Promise<readonly EvidenceRecord[]>;
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly EvidenceRecord[]>;
  /** The full, immutable evidence history, oldest first. */
  getHistory(organizationId: OrganizationId): Promise<readonly EvidenceRecord[]>;
}

/** Creates a real {@link EvidenceService} backed by an {@link EvidenceRepository}. */
export function createEvidenceService(
  repository: EvidenceRepository,
  eventBus?: ComplianceEventBus,
  now: () => string = nowIso,
): EvidenceService {
  return {
    async collectEvidence(organizationId, input) {
      const timestamp = now();
      const record: EvidenceRecord = {
        id: generateId('evidence'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        controlId: input.controlId,
        frameworkId: input.frameworkId,
        source: input.source,
        description: input.description,
        attachments: (input.attachments ?? []).map((attachment) => ({ ...attachment, id: generateId('evidence-attachment') })),
        collectedAt: timestamp,
      };
      await repository.save(record);
      eventBus?.publish('evidence.collected', { organizationId, evidenceId: record.id, source: record.source });
      return record;
    },

    async get(organizationId, evidenceId) {
      return repository.findById(organizationId, evidenceId);
    },

    async findByControlId(organizationId, controlId) {
      return repository.findByControlId(organizationId, controlId);
    },

    async findByFrameworkId(organizationId, frameworkId) {
      return repository.findByFrameworkId(organizationId, frameworkId);
    },

    async getHistory(organizationId) {
      const all = await repository.findAll(organizationId);
      return [...all].sort((a, b) => (a.collectedAt < b.collectedAt ? -1 : a.collectedAt > b.collectedAt ? 1 : 0));
    },
  };
}
