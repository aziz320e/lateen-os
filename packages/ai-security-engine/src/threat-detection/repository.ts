/** @module threat-detection/repository */
import type { OrganizationId, ThreatId } from '../shared/identifiers.js';
import type { Threat, ThreatType } from './types.js';

export interface ThreatRepository {
  save(threat: Threat): Promise<void>;
  findById(organizationId: OrganizationId, threatId: ThreatId): Promise<Threat | null>;
  findAll(organizationId: OrganizationId): Promise<readonly Threat[]>;
  findByType(organizationId: OrganizationId, threatType: ThreatType): Promise<readonly Threat[]>;
}
