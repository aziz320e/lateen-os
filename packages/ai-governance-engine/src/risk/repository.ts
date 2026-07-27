/** @module risk/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, RiskId } from '../shared/identifiers.js';
import type { Risk, RiskLevel, RiskStatus } from './types.js';

export interface RiskRepository extends Repository<Risk, RiskId> {
  findAll(organizationId: OrganizationId): Promise<readonly Risk[]>;
  findByLevel(organizationId: OrganizationId, riskLevel: RiskLevel): Promise<readonly Risk[]>;
  findByStatus(organizationId: OrganizationId, status: RiskStatus): Promise<readonly Risk[]>;
}
