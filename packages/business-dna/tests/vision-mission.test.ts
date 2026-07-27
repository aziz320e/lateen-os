import { describe, expect, it } from 'vitest';
import { createVisionMissionRepository } from '../src/vision-mission/repository.impl.js';
import { canTransitionObjective, createVisionMissionEngine } from '../src/vision-mission/engine.impl.js';
import { InvalidObjectiveTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('canTransitionObjective', () => {
  it('allows planned -> in_progress -> achieved', () => {
    expect(canTransitionObjective('planned', 'in_progress')).toBe(true);
    expect(canTransitionObjective('in_progress', 'achieved')).toBe(true);
  });

  it('rejects transitions out of terminal states', () => {
    expect(canTransitionObjective('achieved', 'in_progress')).toBe(false);
    expect(canTransitionObjective('abandoned', 'planned')).toBe(false);
  });
});

describe('createVisionMissionEngine', () => {
  it('setVisionMission() creates the singleton on first call', async () => {
    const engine = createVisionMissionEngine(createVisionMissionRepository());
    const result = await engine.setVisionMission(ORG, { vision: 'A world of great signage', mission: 'Build it fast', values: ['craft', 'speed'] });
    expect(result.id).toBe(ORG);
    expect(result.vision).toBe('A world of great signage');
    expect(result.values).toEqual(['craft', 'speed']);
  });

  it('setVisionMission() preserves values when not provided', async () => {
    const engine = createVisionMissionEngine(createVisionMissionRepository());
    await engine.setVisionMission(ORG, { vision: 'v1', mission: 'm1', values: ['a'] });
    const updated = await engine.setVisionMission(ORG, { vision: 'v2', mission: 'm2' });
    expect(updated.values).toEqual(['a']);
  });

  it('addStrategicObjective() appends an objective in planned status', async () => {
    const engine = createVisionMissionEngine(createVisionMissionRepository());
    const result = await engine.addStrategicObjective(ORG, { title: 'Expand to Jeddah' });
    expect(result.strategicObjectives).toHaveLength(1);
    expect(result.strategicObjectives[0]?.status).toBe('planned');
  });

  it('updateObjectiveStatus() is guarded', async () => {
    const engine = createVisionMissionEngine(createVisionMissionRepository());
    const created = await engine.addStrategicObjective(ORG, { title: 'Expand to Jeddah' });
    const objectiveId = created.strategicObjectives[0]!.objectiveId;

    const inProgress = await engine.updateObjectiveStatus(ORG, objectiveId, 'in_progress');
    expect(inProgress.strategicObjectives[0]?.status).toBe('in_progress');

    const achieved = await engine.updateObjectiveStatus(ORG, objectiveId, 'achieved');
    expect(achieved.strategicObjectives[0]?.status).toBe('achieved');

    await expect(engine.updateObjectiveStatus(ORG, objectiveId, 'in_progress')).rejects.toBeInstanceOf(InvalidObjectiveTransitionError);
  });

  it('updateObjectiveStatus() throws for an unknown objective', async () => {
    const engine = createVisionMissionEngine(createVisionMissionRepository());
    await expect(engine.updateObjectiveStatus(ORG, 'missing', 'in_progress')).rejects.toBeInstanceOf(InvalidObjectiveTransitionError);
  });

  it('get() returns null before any write', async () => {
    const engine = createVisionMissionEngine(createVisionMissionRepository());
    expect(await engine.get(ORG)).toBeNull();
  });

  it('is organization-scoped', async () => {
    const engine = createVisionMissionEngine(createVisionMissionRepository());
    await engine.setVisionMission(ORG, { vision: 'v', mission: 'm' });
    expect(await engine.get('org-2')).toBeNull();
  });
});
