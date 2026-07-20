/** @module workflow/repository */
import type { OrganizationId, WorkflowId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Workflow } from './types.js';

export interface WorkflowRepository extends Repository<Workflow, WorkflowId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Workflow | null>;
  findByCodeAndVersion(
    organizationId: OrganizationId,
    code: BusinessCode,
    version: number,
  ): Promise<Workflow | null>;
}
