/** @module framework/repository */
import type { Repository } from '../shared/repository.js';
import type { ComplianceFrameworkId, FrameworkVersionId, OrganizationId } from '../shared/identifiers.js';
import type { ComplianceFramework, ComplianceFrameworkCode, ComplianceFrameworkStatus, ComplianceFrameworkVersion } from './types.js';

export interface ComplianceFrameworkRepository extends Repository<ComplianceFramework, ComplianceFrameworkId> {
  findAll(organizationId: OrganizationId): Promise<readonly ComplianceFramework[]>;
  findByCode(organizationId: OrganizationId, frameworkCode: ComplianceFrameworkCode): Promise<readonly ComplianceFramework[]>;
  findByStatus(organizationId: OrganizationId, status: ComplianceFrameworkStatus): Promise<readonly ComplianceFramework[]>;
}

export interface ComplianceFrameworkVersionRepository extends Repository<ComplianceFrameworkVersion, FrameworkVersionId> {
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly ComplianceFrameworkVersion[]>;
}
