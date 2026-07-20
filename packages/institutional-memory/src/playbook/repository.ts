/** @module playbook/repository */
import type { OrganizationId, PlaybookId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { MemoryTag } from '../shared/primitives.js';
import type { Playbook, PlaybookStatus } from './types.js';

export interface PlaybookRepository extends Repository<Playbook, PlaybookId> {
  findByTag(organizationId: OrganizationId, tag: MemoryTag): Promise<readonly Playbook[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: PlaybookStatus,
  ): Promise<readonly Playbook[]>;
}
