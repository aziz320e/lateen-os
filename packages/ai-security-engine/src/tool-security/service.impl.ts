/**
 * Real Tool Security service — Tool permissions, allow list, deny
 * list, and execution policy, deterministically evaluated (deny always
 * wins), and optionally cross-checked against the real AI Runtime
 * `ToolExecutionFramework` (its public API — never a repository).
 *
 * @module tool-security/service.impl
 */
import type { ToolExecutionFramework } from '@lateen-os/ai-runtime';
import type { SecurityEventBus } from '../events/security-event-bus.js';
import { ToolPolicyNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, ToolPolicyId } from '../shared/identifiers.js';
import type { ToolPolicyRepository } from './repository.js';
import type { ToolExecutionEvaluation, ToolPolicy } from './types.js';

/** Real, optionally-injected AI Runtime collaborator — only the read surface this module needs. */
export interface ToolSecurityDeps {
  readonly toolExecution?: Pick<ToolExecutionFramework, 'listTools'>;
}

export interface CreateToolPolicyInput {
  readonly name: string;
  readonly allowedToolIds?: readonly string[];
  readonly deniedToolIds?: readonly string[];
}

export interface ToolSecurityService {
  createPolicy(organizationId: OrganizationId, input: CreateToolPolicyInput): Promise<ToolPolicy>;
  archivePolicy(organizationId: OrganizationId, policyId: ToolPolicyId): Promise<ToolPolicy>;
  getPolicy(organizationId: OrganizationId, policyId: ToolPolicyId): Promise<ToolPolicy | null>;
  isToolAllowed(policy: ToolPolicy, toolId: string): boolean;
  /** Evaluates a tool execution request against a policy; publishes `tool.blocked` when denied. */
  checkToolExecution(organizationId: OrganizationId, policyId: ToolPolicyId, toolId: string): Promise<ToolExecutionEvaluation>;
  /** `true` when AI Runtime is injected and the tool is registered in its real `ToolExecutionFramework`. `false` when not injected. */
  isToolRegisteredInRuntime(toolId: string): boolean;
}

/** Creates a real {@link ToolSecurityService} backed by a {@link ToolPolicyRepository} and an optional real AI Runtime `ToolExecutionFramework`. */
export function createToolSecurityService(
  repository: ToolPolicyRepository,
  deps: ToolSecurityDeps = {},
  eventBus?: SecurityEventBus,
  now: () => string = nowIso,
): ToolSecurityService {
  async function requirePolicy(organizationId: OrganizationId, policyId: ToolPolicyId): Promise<ToolPolicy> {
    const policy = await repository.findById(organizationId, policyId);
    if (!policy) throw new ToolPolicyNotFoundError(policyId);
    return policy;
  }

  function isToolAllowed(policy: ToolPolicy, toolId: string): boolean {
    if (policy.deniedToolIds.includes(toolId)) return false;
    if (policy.allowedToolIds.length === 0) return true;
    return policy.allowedToolIds.includes(toolId);
  }

  return {
    async createPolicy(organizationId, input) {
      const timestamp = now();
      const policy: ToolPolicy = {
        id: generateId('tool-policy'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        status: 'active',
        allowedToolIds: input.allowedToolIds ?? [],
        deniedToolIds: input.deniedToolIds ?? [],
      };
      await repository.save(policy);
      return policy;
    },

    async archivePolicy(organizationId, policyId) {
      const policy = await requirePolicy(organizationId, policyId);
      const updated: ToolPolicy = { ...policy, status: 'archived', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async getPolicy(organizationId, policyId) {
      return repository.findById(organizationId, policyId);
    },

    isToolAllowed,

    async checkToolExecution(organizationId, policyId, toolId) {
      const policy = await requirePolicy(organizationId, policyId);
      if (!isToolAllowed(policy, toolId)) {
        eventBus?.publish('tool.blocked', { organizationId, toolId, reason: 'tool_not_allowed' });
        return { allowed: false, reason: 'tool_not_allowed' };
      }
      return { allowed: true };
    },

    isToolRegisteredInRuntime(toolId) {
      if (!deps.toolExecution) return false;
      return deps.toolExecution.listTools().some((tool) => tool.toolId === toolId);
    },
  };
}
