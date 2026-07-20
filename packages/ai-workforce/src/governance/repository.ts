/** @module governance/repository */
import type { Repository } from '../shared/repository.js';
import type {
  ApprovalRequirement,
  ApprovalRequirementId,
  AuditRecord,
  ComplianceCheck,
  ComplianceCheckId,
  WorkforceAuditRecordId,
} from './types.js';

export type ApprovalRequirementRepository = Repository<ApprovalRequirement, ApprovalRequirementId>;
export type ComplianceCheckRepository = Repository<ComplianceCheck, ComplianceCheckId>;
export type AuditRecordRepository = Repository<AuditRecord, WorkforceAuditRecordId>;
