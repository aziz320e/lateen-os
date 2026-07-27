/** @module evidence/repository */
import type { ReadRepository, WriteRepository } from '../shared/repository.js';
import type { ComplianceControlId, ComplianceFrameworkId, EvidenceRecordId, OrganizationId } from '../shared/identifiers.js';
import type { EvidenceRecord } from './types.js';

/** Evidence is append-only — no update, matching the immutable-history requirement. */
export interface EvidenceRepository extends ReadRepository<EvidenceRecord, EvidenceRecordId>, Pick<WriteRepository<EvidenceRecord, EvidenceRecordId>, 'save'> {
  findAll(organizationId: OrganizationId): Promise<readonly EvidenceRecord[]>;
  findByControlId(organizationId: OrganizationId, controlId: ComplianceControlId): Promise<readonly EvidenceRecord[]>;
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly EvidenceRecord[]>;
}
