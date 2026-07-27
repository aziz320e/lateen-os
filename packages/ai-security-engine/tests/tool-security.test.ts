import { describe, expect, it, vi } from 'vitest';
import { createToolExecutionFramework } from '@lateen-os/ai-runtime';
import { createToolPolicyRepository } from '../src/tool-security/repository.impl.js';
import { createToolSecurityService } from '../src/tool-security/service.impl.js';
import { createSecurityEventBus } from '../src/events/security-event-bus.js';
import { ToolPolicyNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createSecurityEventBus(), deps = {}) {
  const repository = createToolPolicyRepository();
  const service = createToolSecurityService(repository, deps, eventBus);
  return { repository, service, eventBus };
}

describe('createToolSecurityService — allow/deny evaluation', () => {
  it('createPolicy() creates an active policy with empty lists by default', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'default' });
    expect(policy.status).toBe('active');
    expect(policy.allowedToolIds).toEqual([]);
  });

  it('an empty allow list means every tool not denied is allowed', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'default' });
    expect(service.isToolAllowed(policy, 'send_email')).toBe(true);
  });

  it('a non-empty allow list restricts to only listed tools', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'restricted', allowedToolIds: ['search'] });
    expect(service.isToolAllowed(policy, 'search')).toBe(true);
    expect(service.isToolAllowed(policy, 'send_email')).toBe(false);
  });

  it('deny always wins over allow', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'p', allowedToolIds: ['search'], deniedToolIds: ['search'] });
    expect(service.isToolAllowed(policy, 'search')).toBe(false);
  });

  it('archivePolicy() sets status archived', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'p' });
    const archived = await service.archivePolicy(ORG, policy.id);
    expect(archived.status).toBe('archived');
  });

  it('throws ToolPolicyNotFoundError for an unknown policy', async () => {
    const { service } = setup();
    await expect(service.archivePolicy(ORG, 'missing')).rejects.toBeInstanceOf(ToolPolicyNotFoundError);
  });

  it('getPolicy() returns null for an unknown policy', async () => {
    const { service } = setup();
    expect(await service.getPolicy(ORG, 'missing')).toBeNull();
  });

  it('checkToolExecution() allows a permitted tool', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'p', allowedToolIds: ['search'] });
    const result = await service.checkToolExecution(ORG, policy.id, 'search');
    expect(result).toEqual({ allowed: true });
  });

  it('checkToolExecution() blocks a denied tool and publishes tool.blocked', async () => {
    const eventBus = createSecurityEventBus();
    const blocked = vi.fn();
    eventBus.subscribe('tool.blocked', blocked);
    const { service } = setup(eventBus);
    const policy = await service.createPolicy(ORG, { name: 'p', deniedToolIds: ['delete_all'] });
    const result = await service.checkToolExecution(ORG, policy.id, 'delete_all');
    expect(result).toEqual({ allowed: false, reason: 'tool_not_allowed' });
    expect(blocked).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'p' });
    expect(await repository.findById('org-2', policy.id)).toBeNull();
  });
});

describe('createToolSecurityService without AI Runtime', () => {
  it('isToolRegisteredInRuntime() returns false', () => {
    const { service } = setup();
    expect(service.isToolRegisteredInRuntime('search')).toBe(false);
  });
});

describe('createToolSecurityService with a real AI Runtime ToolExecutionFramework', () => {
  it('isToolRegisteredInRuntime() reflects a real registered tool', () => {
    const toolExecution = createToolExecutionFramework();
    toolExecution.registerTool({
      descriptor: { toolId: 'search', name: 'Search' },
      handler: async () => ({ output: {} }),
    });
    const { service } = setup(createSecurityEventBus(), { toolExecution });
    expect(service.isToolRegisteredInRuntime('search')).toBe(true);
    expect(service.isToolRegisteredInRuntime('unknown_tool')).toBe(false);
  });
});
