import { describe, expect, it, vi } from 'vitest';
import { createObservabilityEventBus } from '../src/events/observability-event-bus.js';
import { createLogEntryRepository } from '../src/logging/repository.impl.js';
import { createLoggingEngine } from '../src/logging/engine.impl.js';
import type { LogLevel } from '../src/logging/types.js';

const ORG = 'org-1';

function setup() {
  const repository = createLogEntryRepository();
  const eventBus = createObservabilityEventBus();
  const engine = createLoggingEngine(repository, eventBus);
  return { repository, eventBus, engine };
}

describe('createLoggingEngine — level methods', () => {
  const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

  it.each(levels)('%s() persists an entry at the correct level', async (level) => {
    const { engine } = setup();
    const method = engine[level].bind(engine);
    const entry = await method(ORG, `${level} message`);
    expect(entry.level).toBe(level);
    expect(entry.message).toBe(`${level} message`);
  });

  it('log() accepts structured fields, category, scope, and correlationId', async () => {
    const { engine } = setup();
    const entry = await engine.log(ORG, 'info', 'structured', {
      category: 'workflow',
      scope: 'orchestrator',
      correlationId: 'corr-1',
      fields: { instanceId: 'inst-1' },
    });
    expect(entry.category).toBe('workflow');
    expect(entry.scope).toBe('orchestrator');
    expect(entry.correlationId).toBe('corr-1');
    expect(entry.fields).toEqual({ instanceId: 'inst-1' });
  });

  it('assigns unique ids and matching createdAt/updatedAt/loggedAt', async () => {
    const { engine } = setup();
    const entry = await engine.info(ORG, 'hello');
    expect(entry.id).toMatch(/^log-entry-/);
    expect(entry.createdAt).toBe(entry.loggedAt);
    expect(entry.updatedAt).toBe(entry.loggedAt);
  });
});

describe('createLoggingEngine — event publishing', () => {
  it('publishes log.created with organizationId, logEntryId, level, and category', async () => {
    const { engine, eventBus } = setup();
    const handler = vi.fn();
    eventBus.subscribe('log.created', handler);
    const entry = await engine.warn(ORG, 'careful', { category: 'security' });
    expect(handler).toHaveBeenCalledWith(
      { organizationId: ORG, logEntryId: entry.id, level: 'warn', category: 'security' },
      expect.anything(),
    );
  });

  it('defaults category to "uncategorized" when not provided', async () => {
    const { engine, eventBus } = setup();
    const handler = vi.fn();
    eventBus.subscribe('log.created', handler);
    await engine.info(ORG, 'no category');
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ category: 'uncategorized' }), expect.anything());
  });
});

describe('createLoggingEngine — get / list / org scoping', () => {
  it('get() returns null for an unknown log entry', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('get() returns a previously logged entry', async () => {
    const { engine } = setup();
    const entry = await engine.info(ORG, 'findable');
    expect(await engine.get(ORG, entry.id)).toEqual(entry);
  });

  it('list() returns every logged entry for the organization', async () => {
    const { engine } = setup();
    await engine.info(ORG, 'one');
    await engine.warn(ORG, 'two');
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const entry = await engine.info(ORG, 'scoped');
    expect(await repository.findById('org-2', entry.id)).toBeNull();
  });
});

describe('createLogEntryRepository — query helpers', () => {
  it('findByLevel filters by level', async () => {
    const { engine, repository } = setup();
    await engine.info(ORG, 'a');
    await engine.error(ORG, 'b');
    const errors = await repository.findByLevel(ORG, 'error');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toBe('b');
  });

  it('findByCategory filters by category', async () => {
    const { engine, repository } = setup();
    await engine.info(ORG, 'a', { category: 'x' });
    await engine.info(ORG, 'b', { category: 'y' });
    const filtered = await repository.findByCategory(ORG, 'x');
    expect(filtered).toHaveLength(1);
  });

  it('findByCorrelationId filters by correlation id', async () => {
    const { engine, repository } = setup();
    await engine.info(ORG, 'a', { correlationId: 'c1' });
    await engine.info(ORG, 'b', { correlationId: 'c2' });
    const filtered = await repository.findByCorrelationId(ORG, 'c1');
    expect(filtered).toHaveLength(1);
  });

  it('findByLevel returns an empty array when no entry matches', async () => {
    const { engine, repository } = setup();
    await engine.info(ORG, 'a');
    expect(await repository.findByLevel(ORG, 'fatal')).toEqual([]);
  });

  it('findByCategory returns an empty array when no entry matches', async () => {
    const { repository } = setup();
    expect(await repository.findByCategory(ORG, 'missing')).toEqual([]);
  });

  it('findByCorrelationId returns an empty array when no entry matches', async () => {
    const { repository } = setup();
    expect(await repository.findByCorrelationId(ORG, 'missing')).toEqual([]);
  });
});

describe('createLoggingEngine — additional coverage', () => {
  it('each call to log() produces a distinct entry id', async () => {
    const { engine } = setup();
    const a = await engine.info(ORG, 'a');
    const b = await engine.info(ORG, 'b');
    expect(a.id).not.toBe(b.id);
  });

  it('fields default to undefined when not provided', async () => {
    const { engine } = setup();
    const entry = await engine.info(ORG, 'plain');
    expect(entry.fields).toBeUndefined();
    expect(entry.category).toBeUndefined();
    expect(entry.scope).toBeUndefined();
    expect(entry.correlationId).toBeUndefined();
  });

  it('accepts an injectable now() clock', async () => {
    const fixed = '2026-03-01T00:00:00.000Z';
    const repository = createLogEntryRepository();
    const engine = createLoggingEngine(repository, undefined, () => fixed);
    const entry = await engine.info(ORG, 'fixed-time');
    expect(entry.createdAt).toBe(fixed);
    expect(entry.updatedAt).toBe(fixed);
    expect(entry.loggedAt).toBe(fixed);
  });

  it('list() returns an empty array for an organization with no entries', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('supports every level via the generic log() method directly', async () => {
    const { engine } = setup();
    const entry = await engine.log(ORG, 'trace', 'via log()');
    expect(entry.level).toBe('trace');
  });
});
