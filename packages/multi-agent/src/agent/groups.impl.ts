/**
 * Agent Groups — real cross-mission grouping of agents.
 *
 * @module agent/groups.impl
 */
import { NotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { AgentGroupRepository } from './repository.js';
import type { AgentGroup, AgentGroupId, WorkerId } from './types.js';

export interface AgentGroupService {
  create(organizationId: OrganizationId, name: string, memberWorkerIds: readonly WorkerId[], description?: string): Promise<AgentGroup>;
  addMember(organizationId: OrganizationId, groupId: AgentGroupId, workerId: WorkerId): Promise<AgentGroup>;
  removeMember(organizationId: OrganizationId, groupId: AgentGroupId, workerId: WorkerId): Promise<AgentGroup>;
  list(organizationId: OrganizationId): Promise<readonly AgentGroup[]>;
}

/** Creates a real {@link AgentGroupService} backed by an {@link AgentGroupRepository}. */
export function createAgentGroupService(repository: AgentGroupRepository): AgentGroupService {
  async function requireGroup(organizationId: OrganizationId, groupId: AgentGroupId): Promise<AgentGroup> {
    const group = await repository.findById(organizationId, groupId);
    if (!group) throw new NotFoundError('AgentGroup', groupId);
    return group;
  }

  return {
    async create(organizationId, name, memberWorkerIds, description) {
      const now = nowIso();
      const group: AgentGroup = {
        id: generateId('agent-group'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        name,
        description,
        memberWorkerIds,
      };
      await repository.save(group);
      return group;
    },

    async addMember(organizationId, groupId, workerId) {
      const group = await requireGroup(organizationId, groupId);
      if (group.memberWorkerIds.includes(workerId)) return group;
      const updated: AgentGroup = { ...group, memberWorkerIds: [...group.memberWorkerIds, workerId], updatedAt: nowIso() };
      await repository.save(updated);
      return updated;
    },

    async removeMember(organizationId, groupId, workerId) {
      const group = await requireGroup(organizationId, groupId);
      const updated: AgentGroup = {
        ...group,
        memberWorkerIds: group.memberWorkerIds.filter((id) => id !== workerId),
        updatedAt: nowIso(),
      };
      await repository.save(updated);
      return updated;
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
