/**
 * Real Agent Governance service — registration approval, suspension,
 * retirement, capability restrictions, and runtime permissions for AI
 * Runtime agents. Optionally cross-checks a real, injected AI Runtime
 * `AgentRegistryService` to confirm a governed agent is genuinely
 * registered in the runtime — degrades to `false` when not injected.
 *
 * @module agent-governance/service.impl
 */
import { AgentGovernanceRecordNotFoundError, InvalidAgentTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AgentGovernanceRecordId, OrganizationId } from '../shared/identifiers.js';
import type { AgentGovernanceRecordRepository } from './repository.js';
import type { AgentGovernanceRecord, AgentGovernanceStatus } from './types.js';

const AGENT_TRANSITIONS: Readonly<Record<AgentGovernanceStatus, readonly AgentGovernanceStatus[]>> = {
  pending: ['approved', 'retired'],
  approved: ['suspended', 'retired'],
  suspended: ['approved', 'retired'],
  retired: [],
};

/** Whether an agent governance record may transition from one status to another. */
export function canTransitionAgent(from: AgentGovernanceStatus, to: AgentGovernanceStatus): boolean {
  return AGENT_TRANSITIONS[from].includes(to);
}

/** Minimal slice of AI Runtime's `AgentRegistryService` this module depends on. */
export interface AgentRuntimeRegistryPort {
  getRegistry(organizationId: string): Promise<{ readonly registrations: readonly { readonly descriptor: { readonly runtimeAgentId: string }; readonly active: boolean }[] }>;
}

export interface AgentGovernanceDeps {
  readonly aiRuntime?: AgentRuntimeRegistryPort;
}

export interface RequestAgentRegistrationInput {
  readonly runtimeAgentId: string;
  readonly reason?: string;
}

export interface AgentGovernanceService {
  requestRegistration(organizationId: OrganizationId, input: RequestAgentRegistrationInput): Promise<AgentGovernanceRecord>;
  approveRegistration(organizationId: OrganizationId, recordId: AgentGovernanceRecordId): Promise<AgentGovernanceRecord>;
  suspend(organizationId: OrganizationId, recordId: AgentGovernanceRecordId, reason?: string): Promise<AgentGovernanceRecord>;
  retire(organizationId: OrganizationId, recordId: AgentGovernanceRecordId, reason?: string): Promise<AgentGovernanceRecord>;
  restrictCapabilities(organizationId: OrganizationId, recordId: AgentGovernanceRecordId, capabilities: readonly string[]): Promise<AgentGovernanceRecord>;
  setRuntimePermissions(organizationId: OrganizationId, recordId: AgentGovernanceRecordId, permissions: readonly string[]): Promise<AgentGovernanceRecord>;
  get(organizationId: OrganizationId, recordId: AgentGovernanceRecordId): Promise<AgentGovernanceRecord | null>;
  /** Real, deterministic check against the injected AI Runtime agent registry. `false` if not injected or not actively registered. */
  isAgentRegisteredInRuntime(organizationId: OrganizationId, runtimeAgentId: string): Promise<boolean>;
}

/** Creates a real {@link AgentGovernanceService} backed by an {@link AgentGovernanceRecordRepository}. */
export function createAgentGovernanceService(
  repository: AgentGovernanceRecordRepository,
  deps: AgentGovernanceDeps = {},
  now: () => string = nowIso,
): AgentGovernanceService {
  async function requireRecord(organizationId: OrganizationId, recordId: AgentGovernanceRecordId): Promise<AgentGovernanceRecord> {
    const record = await repository.findById(organizationId, recordId);
    if (!record) throw new AgentGovernanceRecordNotFoundError(recordId);
    return record;
  }

  async function transition(organizationId: OrganizationId, recordId: AgentGovernanceRecordId, to: AgentGovernanceStatus, reason?: string): Promise<AgentGovernanceRecord> {
    const record = await requireRecord(organizationId, recordId);
    if (!canTransitionAgent(record.status, to)) {
      throw new InvalidAgentTransitionError(recordId, record.status, to);
    }
    const updated: AgentGovernanceRecord = { ...record, status: to, reason: reason ?? record.reason, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async requestRegistration(organizationId, input) {
      const timestamp = now();
      const record: AgentGovernanceRecord = {
        id: generateId('agent-governance-record'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        runtimeAgentId: input.runtimeAgentId,
        status: 'pending',
        capabilityRestrictions: [],
        runtimePermissions: [],
        reason: input.reason,
      };
      await repository.save(record);
      return record;
    },

    approveRegistration: (organizationId, recordId) => transition(organizationId, recordId, 'approved'),
    suspend: (organizationId, recordId, reason) => transition(organizationId, recordId, 'suspended', reason),
    retire: (organizationId, recordId, reason) => transition(organizationId, recordId, 'retired', reason),

    async restrictCapabilities(organizationId, recordId, capabilities) {
      const record = await requireRecord(organizationId, recordId);
      const updated: AgentGovernanceRecord = { ...record, capabilityRestrictions: capabilities, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async setRuntimePermissions(organizationId, recordId, permissions) {
      const record = await requireRecord(organizationId, recordId);
      const updated: AgentGovernanceRecord = { ...record, runtimePermissions: permissions, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, recordId) {
      return repository.findById(organizationId, recordId);
    },

    async isAgentRegisteredInRuntime(organizationId, runtimeAgentId) {
      if (!deps.aiRuntime) return false;
      const registry = await deps.aiRuntime.getRegistry(organizationId);
      return registry.registrations.some((registration) => registration.descriptor.runtimeAgentId === runtimeAgentId && registration.active);
    },
  };
}
