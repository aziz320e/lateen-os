/** @module alerting/repository */
import type { Repository } from '../shared/repository.js';
import type { AlertId, OrganizationId } from '../shared/identifiers.js';
import type { Alert, AlertStatus, AlertType } from './types.js';

export interface AlertRepository extends Repository<Alert, AlertId> {
  findAll(organizationId: OrganizationId): Promise<readonly Alert[]>;
  findByStatus(organizationId: OrganizationId, status: AlertStatus): Promise<readonly Alert[]>;
  findByType(organizationId: OrganizationId, alertType: AlertType): Promise<readonly Alert[]>;
}
