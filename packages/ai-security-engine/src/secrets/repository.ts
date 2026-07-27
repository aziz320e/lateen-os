/** @module secrets/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, SecretId } from '../shared/identifiers.js';
import type { Secret, SecretStatus, SecretType } from './types.js';

export interface SecretRepository extends Repository<Secret, SecretId> {
  findAll(organizationId: OrganizationId): Promise<readonly Secret[]>;
  findByType(organizationId: OrganizationId, secretType: SecretType): Promise<readonly Secret[]>;
  findByStatus(organizationId: OrganizationId, status: SecretStatus): Promise<readonly Secret[]>;
}
