import { describe, expect, it } from 'vitest';
import { createRequestContextEngine, generateCorrelationId } from '../src/context/engine.impl.js';
import { createRequestContextRepository } from '../src/context/repository.impl.js';
import { RequestContextNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  return { engine: createRequestContextEngine(createRequestContextRepository()) };
}

describe('generateCorrelationId', () => {
  it('produces a real, unique RFC 4122 UUID each call', () => {
    const a = generateCorrelationId();
    const b = generateCorrelationId();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});

describe('RequestContextEngine', () => {
  it('createContext() starts a context in_flight', async () => {
    const { engine } = setup();
    const context = await engine.createContext(ORG, { method: 'GET', path: '/crm/customers' });
    expect(context.status).toBe('in_flight');
    expect(context.id).toBeTruthy();
  });

  it('completeContext() records the statusCode and moves to completed', async () => {
    const { engine } = setup();
    const context = await engine.createContext(ORG, { method: 'GET', path: '/crm/customers' });
    const completed = await engine.completeContext(ORG, context.id, 200);
    expect(completed.status).toBe('completed');
    expect(completed.statusCode).toBe(200);
    expect(completed.completedAt).toBeTruthy();
  });

  it('rejectContext() records the reason and moves to rejected', async () => {
    const { engine } = setup();
    const context = await engine.createContext(ORG, { method: 'GET', path: '/crm/customers' });
    const rejected = await engine.rejectContext(ORG, context.id, 'unauthorized');
    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectionReason).toBe('unauthorized');
  });

  it('completeContext() throws RequestContextNotFoundError for an unknown context', async () => {
    const { engine } = setup();
    await expect(engine.completeContext(ORG, 'missing', 200)).rejects.toBeInstanceOf(RequestContextNotFoundError);
  });

  it('rejectContext() throws RequestContextNotFoundError for an unknown context', async () => {
    const { engine } = setup();
    await expect(engine.rejectContext(ORG, 'missing', 'reason')).rejects.toBeInstanceOf(RequestContextNotFoundError);
  });

  it('carries an optional principalId through', async () => {
    const { engine } = setup();
    const context = await engine.createContext(ORG, { method: 'POST', path: '/crm/customers', principalId: 'principal-1' });
    expect(context.principalId).toBe('principal-1');
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const context = await engine.createContext(ORG, { method: 'GET', path: '/x' });
    expect(await engine.get(ORG, context.id)).toEqual(context);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('contexts are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createContext(ORG, { method: 'GET', path: '/x' });
    await engine.createContext('org-2', { method: 'GET', path: '/x' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('generateCorrelationId produces unique ids across many calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateCorrelationId()));
    expect(ids.size).toBe(100);
  });

  it('a context without a principalId leaves it undefined', async () => {
    const { engine } = setup();
    const context = await engine.createContext(ORG, { method: 'GET', path: '/x' });
    expect(context.principalId).toBeUndefined();
  });

  it('completeContext() sets completedAt', async () => {
    const { engine } = setup();
    const context = await engine.createContext(ORG, { method: 'GET', path: '/x' });
    const completed = await engine.completeContext(ORG, context.id, 200);
    expect(completed.completedAt).toBeTruthy();
    expect(completed.rejectionReason).toBeUndefined();
  });

  it('list() reflects every context created for the organization, in creation order', async () => {
    const { engine } = setup();
    const first = await engine.createContext(ORG, { method: 'GET', path: '/a' });
    const second = await engine.createContext(ORG, { method: 'GET', path: '/b' });
    const contexts = await engine.list(ORG);
    expect(contexts.map((context) => context.id)).toEqual([first.id, second.id]);
  });

  it('a rejected context leaves statusCode undefined', async () => {
    const { engine } = setup();
    const context = await engine.createContext(ORG, { method: 'GET', path: '/x' });
    const rejected = await engine.rejectContext(ORG, context.id, 'policy_denied');
    expect(rejected.statusCode).toBeUndefined();
  });

  it('createContext() records the requested method and path verbatim', async () => {
    const { engine } = setup();
    const context = await engine.createContext(ORG, { method: 'POST', path: '/crm/customers/notes' });
    expect(context.method).toBe('POST');
    expect(context.path).toBe('/crm/customers/notes');
  });
});
