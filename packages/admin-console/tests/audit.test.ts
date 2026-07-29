import { describe, expect, it } from 'vitest';
import { createAuditCenterEngine } from '../src/audit/engine.impl.js';
import { createAuditEntryRepository } from '../src/audit/repository.impl.js';
import { createAdminEventBus } from '../src/events/index.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createAdminEventBus();
  const engine = createAuditCenterEngine(createAuditEntryRepository(), eventBus);
  return { engine, eventBus };
}

describe('AuditCenterEngine', () => {
  it('recordAudit() persists actor/action/target/metadata verbatim', async () => {
    const { engine } = setup();
    const entry = await engine.recordAudit(ORG, {
      actor: { id: 'user-1', type: 'user' },
      action: 'user.suspended',
      target: { type: 'user', id: 'user-2' },
      metadata: { reason: 'policy violation' },
    });
    expect(entry.actor).toEqual({ id: 'user-1', type: 'user' });
    expect(entry.action).toBe('user.suspended');
    expect(entry.target).toEqual({ type: 'user', id: 'user-2' });
    expect(entry.metadata).toEqual({ reason: 'policy violation' });
  });

  it('recordAudit() defaults metadata to an empty object when not given', async () => {
    const { engine } = setup();
    const entry = await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 'session-1' } });
    expect(entry.metadata).toEqual({});
  });

  it('publishes audit.recorded', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('audit.recorded', (payload) => (seen = payload));
    const entry = await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 'session-1' } });
    expect(seen).toEqual({ organizationId: ORG, auditEntryId: entry.id, action: 'login' });
  });

  it('getAudit()/listAudits() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getAudit(ORG, 'missing')).toBeNull();
    const entry = await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 'session-1' } });
    expect(await engine.getAudit(ORG, entry.id)).toEqual(entry);
    expect(await engine.listAudits(ORG)).toHaveLength(1);
  });

  it('findForActor() filters by actor id', async () => {
    const { engine } = setup();
    await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    await engine.recordAudit(ORG, { actor: { id: 'user-2', type: 'user' }, action: 'login', target: { type: 'session', id: 's2' } });
    const entries = await engine.findForActor(ORG, 'user-1');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.actor.id).toBe('user-1');
  });

  it('findForTarget() filters by target type and id', async () => {
    const { engine } = setup();
    await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'user.suspended', target: { type: 'user', id: 'user-2' } });
    await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'role.archived', target: { type: 'role', id: 'role-1' } });
    const entries = await engine.findForTarget(ORG, 'user', 'user-2');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.action).toBe('user.suspended');
  });

  it('audit entries accumulate — there is no update or delete on the public surface', async () => {
    const { engine } = setup();
    await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'logout', target: { type: 'session', id: 's1' } });
    expect(await engine.listAudits(ORG)).toHaveLength(2);
  });

  it('audit entries are isolated per organization', async () => {
    const { engine } = setup();
    await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    await engine.recordAudit('org-2', { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    expect(await engine.listAudits(ORG)).toHaveLength(1);
    expect(await engine.listAudits('org-2')).toHaveLength(1);
  });

  it('findForActor() returns an empty array for an actor with no recorded entries', async () => {
    const { engine } = setup();
    expect(await engine.findForActor(ORG, 'never-acted')).toEqual([]);
  });

  it('findForTarget() returns an empty array for a target with no recorded entries', async () => {
    const { engine } = setup();
    expect(await engine.findForTarget(ORG, 'user', 'never-targeted')).toEqual([]);
  });

  it('findForTarget() distinguishes between two targets of the same type', async () => {
    const { engine } = setup();
    await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'user.suspended', target: { type: 'user', id: 'user-2' } });
    await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'user.suspended', target: { type: 'user', id: 'user-3' } });
    expect(await engine.findForTarget(ORG, 'user', 'user-2')).toHaveLength(1);
  });

  it('an audit entry records its recordedAt timestamp using the injected clock', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const engine = createAuditCenterEngine(createAuditEntryRepository(), undefined, fixedNow);
    const entry = await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    expect(entry.recordedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('recordAudit() supports non-user actor types such as "system"', async () => {
    const { engine } = setup();
    const entry = await engine.recordAudit(ORG, { actor: { id: 'system', type: 'system' }, action: 'scheduled_cleanup.run', target: { type: 'tenant', id: 'tenant-1' } });
    expect(entry.actor).toEqual({ id: 'system', type: 'system' });
  });

  it('two audit entries recorded for the same actor and target are both retained independently', async () => {
    const { engine } = setup();
    const first = await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'role.assigned', target: { type: 'user', id: 'user-2' } });
    const second = await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'role.unassigned', target: { type: 'user', id: 'user-2' } });
    const entries = await engine.findForTarget(ORG, 'user', 'user-2');
    expect(entries.map((entry) => entry.id).sort()).toEqual([first.id, second.id].sort());
  });

  it('findForActor() and findForTarget() can both match the same entry when the actor acted on themselves', async () => {
    const { engine } = setup();
    const entry = await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'profile.updated', target: { type: 'user', id: 'user-1' } });
    expect((await engine.findForActor(ORG, 'user-1')).map((e) => e.id)).toContain(entry.id);
    expect((await engine.findForTarget(ORG, 'user', 'user-1')).map((e) => e.id)).toContain(entry.id);
  });

  it('createdAt and recordedAt are identical for a freshly recorded entry', async () => {
    const { engine } = setup();
    const entry = await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    expect(entry.createdAt).toBe(entry.recordedAt);
  });

  it('listAudits() returns an empty array for an organization with no recorded activity', async () => {
    const { engine } = setup();
    expect(await engine.listAudits(ORG)).toEqual([]);
  });

  it('getAudit() returns the exact entry recorded, including its metadata', async () => {
    const { engine } = setup();
    const entry = await engine.recordAudit(ORG, {
      actor: { id: 'user-1', type: 'user' },
      action: 'settings.updated',
      target: { type: 'setting', id: 's1' },
      metadata: { key: 'theme' },
    });
    expect(await engine.getAudit(ORG, entry.id)).toEqual(entry);
  });

  it('recordAudit() with an empty metadata object explicitly given behaves the same as omitting it', async () => {
    const { engine } = setup();
    const entry = await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' }, metadata: {} });
    expect(entry.metadata).toEqual({});
  });

  it('recordAudit() called for two different organizations never cross-contaminates findForActor()', async () => {
    const { engine } = setup();
    await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    await engine.recordAudit('org-2', { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    expect(await engine.findForActor(ORG, 'user-1')).toHaveLength(1);
  });

  it('getAudit() returns null for an entry id from a different organization', async () => {
    const { engine } = setup();
    const entry = await engine.recordAudit(ORG, { actor: { id: 'user-1', type: 'user' }, action: 'login', target: { type: 'session', id: 's1' } });
    expect(await engine.getAudit('org-2', entry.id)).toBeNull();
  });

  it('preserves arbitrary metadata shapes verbatim', async () => {
    const { engine } = setup();
    const entry = await engine.recordAudit(ORG, {
      actor: { id: 'user-1', type: 'user' },
      action: 'settings.updated',
      target: { type: 'setting', id: 'setting-1' },
      metadata: { before: { theme: 'dark' }, after: { theme: 'light' }, changedFields: ['theme'] },
    });
    expect(entry.metadata).toEqual({ before: { theme: 'dark' }, after: { theme: 'light' }, changedFields: ['theme'] });
  });
});
