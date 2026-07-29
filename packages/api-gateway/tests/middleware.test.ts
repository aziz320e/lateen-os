import { describe, expect, it } from 'vitest';
import { createMiddlewarePipelineEngine, orderSteps } from '../src/middleware/engine.impl.js';
import { createMiddlewareStepRepository } from '../src/middleware/repository.impl.js';
import { MiddlewareStepNotFoundError } from '../src/shared/errors.js';
import type { MiddlewareStep } from '../src/middleware/types.js';

const ORG = 'org-1';

function setup() {
  return { engine: createMiddlewarePipelineEngine(createMiddlewareStepRepository()) };
}

function makeStep(overrides: Partial<MiddlewareStep> = {}): MiddlewareStep {
  return {
    id: 'step-x',
    organizationId: ORG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    name: 'X',
    sequence: 0,
    kind: 'custom',
    enabled: true,
    ...overrides,
  };
}

describe('orderSteps (pure)', () => {
  it('sorts by ascending sequence', () => {
    const steps = [makeStep({ id: 'c', sequence: 3 }), makeStep({ id: 'a', sequence: 1 }), makeStep({ id: 'b', sequence: 2 })];
    expect(orderSteps(steps).map((step) => step.id)).toEqual(['a', 'b', 'c']);
  });

  it('breaks ties on sequence by id ascending', () => {
    const steps = [makeStep({ id: 'b', sequence: 1 }), makeStep({ id: 'a', sequence: 1 })];
    expect(orderSteps(steps).map((step) => step.id)).toEqual(['a', 'b']);
  });

  it('does not mutate the input array', () => {
    const steps = [makeStep({ id: 'b', sequence: 2 }), makeStep({ id: 'a', sequence: 1 })];
    const ordered = orderSteps(steps);
    expect(ordered).not.toBe(steps);
    expect(steps.map((step) => step.id)).toEqual(['b', 'a']);
  });
});

describe('MiddlewarePipelineEngine', () => {
  it('registerStep() defaults enabled to true', async () => {
    const { engine } = setup();
    const step = await engine.registerStep(ORG, { name: 'Auth', sequence: 1, kind: 'authentication' });
    expect(step.enabled).toBe(true);
  });

  it('registerStep() accepts an explicit enabled: false', async () => {
    const { engine } = setup();
    const step = await engine.registerStep(ORG, { name: 'Auth', sequence: 1, kind: 'authentication', enabled: false });
    expect(step.enabled).toBe(false);
  });

  it('enableStep() / disableStep() toggle the flag', async () => {
    const { engine } = setup();
    const step = await engine.registerStep(ORG, { name: 'Auth', sequence: 1, kind: 'authentication' });
    const disabled = await engine.disableStep(ORG, step.id);
    expect(disabled.enabled).toBe(false);
    const enabled = await engine.enableStep(ORG, step.id);
    expect(enabled.enabled).toBe(true);
  });

  it('enableStep() throws MiddlewareStepNotFoundError for an unknown step', async () => {
    const { engine } = setup();
    await expect(engine.enableStep(ORG, 'missing')).rejects.toBeInstanceOf(MiddlewareStepNotFoundError);
  });

  it('getOrderedSteps() returns every step sorted by sequence', async () => {
    const { engine } = setup();
    await engine.registerStep(ORG, { name: 'Validation', sequence: 3, kind: 'validation' });
    await engine.registerStep(ORG, { name: 'Auth', sequence: 1, kind: 'authentication' });
    await engine.registerStep(ORG, { name: 'Authz', sequence: 2, kind: 'authorization' });
    const ordered = await engine.getOrderedSteps(ORG);
    expect(ordered.map((step) => step.name)).toEqual(['Auth', 'Authz', 'Validation']);
  });

  it('getEnabledOrderedSteps() excludes disabled steps', async () => {
    const { engine } = setup();
    await engine.registerStep(ORG, { name: 'Auth', sequence: 1, kind: 'authentication' });
    const disabledStep = await engine.registerStep(ORG, { name: 'RateLimit', sequence: 2, kind: 'rateLimit' });
    await engine.disableStep(ORG, disabledStep.id);
    const ordered = await engine.getEnabledOrderedSteps(ORG);
    expect(ordered.map((step) => step.name)).toEqual(['Auth']);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const step = await engine.registerStep(ORG, { name: 'Auth', sequence: 1, kind: 'authentication' });
    expect(await engine.get(ORG, step.id)).toEqual(step);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('steps are isolated per organization', async () => {
    const { engine } = setup();
    await engine.registerStep(ORG, { name: 'Auth', sequence: 1, kind: 'authentication' });
    await engine.registerStep('org-2', { name: 'Auth', sequence: 1, kind: 'authentication' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('supports every middleware step kind', async () => {
    const { engine } = setup();
    const kinds = ['authentication', 'authorization', 'validation', 'rateLimit', 'custom'] as const;
    for (const kind of kinds) {
      const step = await engine.registerStep(ORG, { name: kind, sequence: 0, kind });
      expect(step.kind).toBe(kind);
    }
  });

  it('getOrderedSteps() returns an empty array when nothing is registered', async () => {
    const { engine } = setup();
    expect(await engine.getOrderedSteps(ORG)).toEqual([]);
  });

  it('getEnabledOrderedSteps() returns an empty array once every step has been disabled', async () => {
    const { engine } = setup();
    const step = await engine.registerStep(ORG, { name: 'Auth', sequence: 1, kind: 'authentication' });
    await engine.disableStep(ORG, step.id);
    expect(await engine.getEnabledOrderedSteps(ORG)).toEqual([]);
  });

  it('disableStep() is idempotent when called twice', async () => {
    const { engine } = setup();
    const step = await engine.registerStep(ORG, { name: 'Auth', sequence: 1, kind: 'authentication' });
    await engine.disableStep(ORG, step.id);
    const twice = await engine.disableStep(ORG, step.id);
    expect(twice.enabled).toBe(false);
  });

  it('disableStep() throws MiddlewareStepNotFoundError for an unknown step', async () => {
    const { engine } = setup();
    await expect(engine.disableStep(ORG, 'missing')).rejects.toBeInstanceOf(MiddlewareStepNotFoundError);
  });

  it('orderSteps() applied by getOrderedSteps() breaks a three-way sequence tie by id ascending', async () => {
    const { engine } = setup();
    await engine.registerStep(ORG, { name: 'C', sequence: 1, kind: 'custom' });
    await engine.registerStep(ORG, { name: 'A', sequence: 1, kind: 'custom' });
    await engine.registerStep(ORG, { name: 'B', sequence: 1, kind: 'custom' });
    const ordered = await engine.getOrderedSteps(ORG);
    const ids = ordered.map((step) => step.id);
    expect(ids).toEqual([...ids].sort());
  });
});
