import { describe, expect, it } from 'vitest';
import { createAgentGovernanceRecordRepository } from '../src/agent-governance/repository.impl.js';
import { canTransitionAgent, createAgentGovernanceService, type AgentRuntimeRegistryPort } from '../src/agent-governance/service.impl.js';
import { AgentGovernanceRecordNotFoundError, InvalidAgentTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(aiRuntime?: AgentRuntimeRegistryPort) {
  const repository = createAgentGovernanceRecordRepository();
  const service = createAgentGovernanceService(repository, { aiRuntime });
  return { repository, service };
}

describe('canTransitionAgent (pure)', () => {
  it('allows pending -> approved and pending -> retired', () => {
    expect(canTransitionAgent('pending', 'approved')).toBe(true);
    expect(canTransitionAgent('pending', 'retired')).toBe(true);
  });

  it('allows approved -> suspended -> approved', () => {
    expect(canTransitionAgent('approved', 'suspended')).toBe(true);
    expect(canTransitionAgent('suspended', 'approved')).toBe(true);
  });

  it('retired is terminal', () => {
    expect(canTransitionAgent('retired', 'approved')).toBe(false);
    expect(canTransitionAgent('retired', 'pending')).toBe(false);
  });
});

describe('createAgentGovernanceService — registration lifecycle', () => {
  it('requestRegistration() creates a pending record', async () => {
    const { service } = setup();
    const record = await service.requestRegistration(ORG, { runtimeAgentId: 'agent-1' });
    expect(record.status).toBe('pending');
    expect(record.capabilityRestrictions).toEqual([]);
    expect(record.runtimePermissions).toEqual([]);
  });

  it('approveRegistration() transitions pending -> approved', async () => {
    const { service } = setup();
    const record = await service.requestRegistration(ORG, { runtimeAgentId: 'agent-1' });
    const approved = await service.approveRegistration(ORG, record.id);
    expect(approved.status).toBe('approved');
  });

  it('suspend() transitions approved -> suspended', async () => {
    const { service } = setup();
    const record = await service.requestRegistration(ORG, { runtimeAgentId: 'agent-1' });
    await service.approveRegistration(ORG, record.id);
    const suspended = await service.suspend(ORG, record.id, 'policy violation');
    expect(suspended.status).toBe('suspended');
    expect(suspended.reason).toBe('policy violation');
  });

  it('retire() is terminal', async () => {
    const { service } = setup();
    const record = await service.requestRegistration(ORG, { runtimeAgentId: 'agent-1' });
    const retired = await service.retire(ORG, record.id, 'decommissioned');
    await expect(service.approveRegistration(ORG, retired.id)).rejects.toBeInstanceOf(InvalidAgentTransitionError);
  });

  it('throws AgentGovernanceRecordNotFoundError for an unknown record', async () => {
    const { service } = setup();
    await expect(service.approveRegistration(ORG, 'missing')).rejects.toBeInstanceOf(AgentGovernanceRecordNotFoundError);
  });
});

describe('createAgentGovernanceService — capability restrictions and runtime permissions', () => {
  it('restrictCapabilities() sets the restriction list', async () => {
    const { service } = setup();
    const record = await service.requestRegistration(ORG, { runtimeAgentId: 'agent-1' });
    const updated = await service.restrictCapabilities(ORG, record.id, ['no_financial_data']);
    expect(updated.capabilityRestrictions).toEqual(['no_financial_data']);
  });

  it('setRuntimePermissions() sets the permission list', async () => {
    const { service } = setup();
    const record = await service.requestRegistration(ORG, { runtimeAgentId: 'agent-1' });
    const updated = await service.setRuntimePermissions(ORG, record.id, ['read_only']);
    expect(updated.runtimePermissions).toEqual(['read_only']);
  });

  it('capability restrictions and runtime permissions are independent of each other', async () => {
    const { service } = setup();
    const record = await service.requestRegistration(ORG, { runtimeAgentId: 'agent-1' });
    await service.restrictCapabilities(ORG, record.id, ['no_financial_data']);
    const updated = await service.setRuntimePermissions(ORG, record.id, ['read_only']);
    expect(updated.capabilityRestrictions).toEqual(['no_financial_data']);
    expect(updated.runtimePermissions).toEqual(['read_only']);
  });
});

describe('createAgentGovernanceService — isAgentRegisteredInRuntime', () => {
  it('returns false when AI Runtime is not injected', async () => {
    const { service } = setup();
    expect(await service.isAgentRegisteredInRuntime(ORG, 'agent-1')).toBe(false);
  });

  it('returns true for a real, actively registered agent', async () => {
    const aiRuntime: AgentRuntimeRegistryPort = {
      async getRegistry() {
        return { registrations: [{ descriptor: { runtimeAgentId: 'agent-1' }, active: true }] };
      },
    };
    const { service } = setup(aiRuntime);
    expect(await service.isAgentRegisteredInRuntime(ORG, 'agent-1')).toBe(true);
  });

  it('returns false for a registered-but-inactive agent', async () => {
    const aiRuntime: AgentRuntimeRegistryPort = {
      async getRegistry() {
        return { registrations: [{ descriptor: { runtimeAgentId: 'agent-1' }, active: false }] };
      },
    };
    const { service } = setup(aiRuntime);
    expect(await service.isAgentRegisteredInRuntime(ORG, 'agent-1')).toBe(false);
  });

  it('returns false for an agent not present in the registry', async () => {
    const aiRuntime: AgentRuntimeRegistryPort = {
      async getRegistry() {
        return { registrations: [] };
      },
    };
    const { service } = setup(aiRuntime);
    expect(await service.isAgentRegisteredInRuntime(ORG, 'agent-1')).toBe(false);
  });
});

describe('createAgentGovernanceService — get / org scoping', () => {
  it('get() returns null for an unknown record', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { service, repository } = setup();
    const record = await service.requestRegistration(ORG, { runtimeAgentId: 'agent-1' });
    expect(await repository.findById('org-2', record.id)).toBeNull();
  });
});
