/** @module signals/repository */
import type { OrganizationId, SignalId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Signal, SignalStatus, SignalType } from './types.js';

export interface SignalRepository extends Repository<Signal, SignalId> {
  findByType(organizationId: OrganizationId, type: SignalType): Promise<readonly Signal[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: SignalStatus,
  ): Promise<readonly Signal[]>;
}
