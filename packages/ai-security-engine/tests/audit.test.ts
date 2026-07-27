import { describe, expect, it, vi } from 'vitest';
import { createAuditEventRepository } from '../src/audit/repository.impl.js';
import { createAuditService } from '../src/audit/service.impl.js';
import { createSecurityEventBus } from '../src/events/security-event-bus.js';

const ORG = 'org-1';

function setup(eventBus = createSecurityEventBus()) {
  const repository = createAuditEventRepository();
  const service = createAuditService(repository, eventBus);
  return { repository, service, eventBus };
}

describe('createAuditService', () => {
  it('record() persists an immutable audit event', async () => {
    const { service } = setup();
    const event = await service.record(ORG, { category: 'authentication', action: 'login', outcome: 'success' });
    expect(event.category).toBe('authentication');
    expect(event.occurredAt).toBeDefined();
  });

  it('publishes audit.created on every record', async () => {
    const eventBus = createSecurityEventBus();
    const created = vi.fn();
    eventBus.subscribe('audit.created', created);
    const { service } = setup(eventBus);
    await service.record(ORG, { category: 'authentication', action: 'login', outcome: 'success' });
    await Promise.resolve();
    expect(created).toHaveBeenCalledTimes(1);
  });

  it('findAll() returns every event for the organization', async () => {
    const { service } = setup();
    await service.record(ORG, { category: 'authentication', action: 'a', outcome: 'success' });
    await service.record(ORG, { category: 'authorization', action: 'b', outcome: 'failure' });
    expect(await service.findAll(ORG)).toHaveLength(2);
  });

  it('findByCategory() filters by category', async () => {
    const { service } = setup();
    await service.record(ORG, { category: 'secret', action: 'rotate', outcome: 'success' });
    await service.record(ORG, { category: 'policy', action: 'update', outcome: 'success' });
    expect(await service.findByCategory(ORG, 'secret')).toHaveLength(1);
  });

  it('findByActor() filters by actorId', async () => {
    const { service } = setup();
    await service.record(ORG, { category: 'authentication', action: 'login', actorId: 'identity-1', outcome: 'success' });
    await service.record(ORG, { category: 'authentication', action: 'login', actorId: 'identity-2', outcome: 'success' });
    const events = await service.findByActor(ORG, 'identity-1');
    expect(events).toHaveLength(1);
  });

  it('findAccessHistory() returns only authentication and authorization entries', async () => {
    const { service } = setup();
    await service.record(ORG, { category: 'authentication', action: 'login', outcome: 'success' });
    await service.record(ORG, { category: 'authorization', action: 'authorize', outcome: 'failure' });
    await service.record(ORG, { category: 'secret', action: 'rotate', outcome: 'success' });
    const history = await service.findAccessHistory(ORG);
    expect(history).toHaveLength(2);
    expect(history.every((event) => event.category === 'authentication' || event.category === 'authorization')).toBe(true);
  });

  it('findPolicyHistory() returns only policy entries', async () => {
    const { service } = setup();
    await service.record(ORG, { category: 'policy', action: 'create_policy', outcome: 'success' });
    await service.record(ORG, { category: 'secret', action: 'rotate', outcome: 'success' });
    const history = await service.findPolicyHistory(ORG);
    expect(history).toHaveLength(1);
    expect(history[0]?.category).toBe('policy');
  });

  it('findViolations() returns only non-success entries', async () => {
    const { service } = setup();
    await service.record(ORG, { category: 'authentication', action: 'login', outcome: 'success' });
    await service.record(ORG, { category: 'authorization', action: 'authorize', outcome: 'failure' });
    await service.record(ORG, { category: 'tool', action: 'execute', outcome: 'blocked' });
    const violations = await service.findViolations(ORG);
    expect(violations).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { service } = setup();
    await service.record(ORG, { category: 'authentication', action: 'login', outcome: 'success' });
    expect(await service.findAll('org-2')).toEqual([]);
  });
});
