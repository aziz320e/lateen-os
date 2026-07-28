import { describe, expect, it } from 'vitest';
import { computeShortage, createMaterialPlanningEngine } from '../src/material/engine.impl.js';
import { createMaterialRequirementRepository } from '../src/material/repository.impl.js';
import { MaterialRequirementNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const PROJECT = 'project-1';

function setup() {
  return { engine: createMaterialPlanningEngine(createMaterialRequirementRepository()) };
}

describe('computeShortage (pure)', () => {
  it('returns the unmet portion of a requirement', () => {
    expect(computeShortage('100.00', '60.00')).toBe('40.00');
  });

  it('floors at 0.00 when fully reserved or over-reserved', () => {
    expect(computeShortage('100.00', '100.00')).toBe('0.00');
    expect(computeShortage('100.00', '120.00')).toBe('0.00');
  });
});

describe('MaterialPlanningEngine', () => {
  it('createRequirement() starts at planned status with zero reserved quantity', async () => {
    const { engine } = setup();
    const requirement = await engine.createRequirement(ORG, { projectId: PROJECT, itemId: 'item-1', requiredQuantity: '100.00' });
    expect(requirement.status).toBe('planned');
    expect(requirement.reservedQuantity).toBe('0.00');
  });

  it('recordReservation() accumulates reserved quantity', async () => {
    const { engine } = setup();
    const requirement = await engine.createRequirement(ORG, { projectId: PROJECT, itemId: 'item-1', requiredQuantity: '100.00' });
    const updated = await engine.recordReservation(ORG, requirement.id, '60.00');
    expect(updated.reservedQuantity).toBe('60.00');
    expect(updated.status).toBe('planned');
  });

  it('recordReservation() transitions to reserved once the requirement is fully met', async () => {
    const { engine } = setup();
    const requirement = await engine.createRequirement(ORG, { projectId: PROJECT, itemId: 'item-1', requiredQuantity: '100.00' });
    await engine.recordReservation(ORG, requirement.id, '60.00');
    const fullyReserved = await engine.recordReservation(ORG, requirement.id, '40.00');
    expect(fullyReserved.status).toBe('reserved');
  });

  it('fulfill() and cancel() change status', async () => {
    const { engine } = setup();
    const requirement = await engine.createRequirement(ORG, { projectId: PROJECT, itemId: 'item-1', requiredQuantity: '100.00' });
    const fulfilled = await engine.fulfill(ORG, requirement.id);
    expect(fulfilled.status).toBe('fulfilled');

    const other = await engine.createRequirement(ORG, { projectId: PROJECT, itemId: 'item-2', requiredQuantity: '10.00' });
    const cancelled = await engine.cancel(ORG, other.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('getShortage() reports the unmet quantity for a requirement', async () => {
    const { engine } = setup();
    const requirement = await engine.createRequirement(ORG, { projectId: PROJECT, itemId: 'item-1', requiredQuantity: '100.00' });
    await engine.recordReservation(ORG, requirement.id, '30.00');
    expect(await engine.getShortage(ORG, requirement.id)).toBe('70.00');
  });

  it('listShortages() returns only requirements with a non-zero shortage', async () => {
    const { engine } = setup();
    const short = await engine.createRequirement(ORG, { projectId: PROJECT, itemId: 'item-1', requiredQuantity: '100.00' });
    const met = await engine.createRequirement(ORG, { projectId: PROJECT, itemId: 'item-2', requiredQuantity: '50.00' });
    await engine.recordReservation(ORG, met.id, '50.00');

    const shortages = await engine.listShortages(ORG, PROJECT);
    expect(shortages.map((requirement) => requirement.id)).toEqual([short.id]);
  });

  it('recordReservation() throws for an unknown requirement', async () => {
    const { engine } = setup();
    await expect(engine.recordReservation(ORG, 'missing', '10.00')).rejects.toBeInstanceOf(MaterialRequirementNotFoundError);
  });

  it('findByProject / findByTask / findByItem filter correctly', async () => {
    const { engine } = setup();
    const requirement = await engine.createRequirement(ORG, { projectId: PROJECT, taskId: 'task-1', itemId: 'item-1', requiredQuantity: '100.00' });
    await engine.createRequirement(ORG, { projectId: 'other-project', itemId: 'item-2', requiredQuantity: '10.00' });

    expect(await engine.findByProject(ORG, PROJECT)).toEqual([requirement]);
    expect(await engine.findByTask(ORG, 'task-1')).toEqual([requirement]);
    expect(await engine.findByItem(ORG, 'item-1')).toEqual([requirement]);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const requirement = await engine.createRequirement(ORG, { projectId: PROJECT, itemId: 'item-1', requiredQuantity: '100.00' });
    expect(await engine.get(ORG, requirement.id)).toEqual(requirement);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('fulfill()/cancel() throw MaterialRequirementNotFoundError for an unknown requirement', async () => {
    const { engine } = setup();
    await expect(engine.fulfill(ORG, 'missing')).rejects.toBeInstanceOf(MaterialRequirementNotFoundError);
    await expect(engine.cancel(ORG, 'missing')).rejects.toBeInstanceOf(MaterialRequirementNotFoundError);
  });

  it('material requirements are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createRequirement(ORG, { projectId: PROJECT, itemId: 'item-1', requiredQuantity: '10.00' });
    await engine.createRequirement('org-2', { projectId: PROJECT, itemId: 'item-1', requiredQuantity: '10.00' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('a material requirement may optionally omit warehouseId', async () => {
    const { engine } = setup();
    const requirement = await engine.createRequirement(ORG, { projectId: PROJECT, itemId: 'item-1', requiredQuantity: '10.00' });
    expect(requirement.warehouseId).toBeUndefined();
  });

  it('listShortages() returns an empty list when every requirement is fully reserved', async () => {
    const { engine } = setup();
    const requirement = await engine.createRequirement(ORG, { projectId: PROJECT, itemId: 'item-1', requiredQuantity: '50.00' });
    await engine.recordReservation(ORG, requirement.id, '50.00');
    expect(await engine.listShortages(ORG, PROJECT)).toEqual([]);
  });
});
