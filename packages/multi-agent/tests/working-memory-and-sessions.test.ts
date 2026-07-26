import { describe, expect, it } from 'vitest';
import { createMultiAgentRuntime } from '../src/runtime.js';

const ORG = 'org-1';
const MISSION = 'mission-1';

describe('Integration: Shared Working Memory', () => {
  it('set() creates version 1, subsequent writes to the same key increment the version', async () => {
    const runtime = createMultiAgentRuntime();
    const first = await runtime.workingMemory.set(ORG, MISSION, 'budget_ceiling', 50000, 'finance-worker');
    expect(first.version).toBe(1);

    const second = await runtime.workingMemory.set(ORG, MISSION, 'budget_ceiling', 45000, 'ceo-worker');
    expect(second.version).toBe(2);
    expect(second.value).toBe(45000);
    expect(second.writerWorkerId).toBe('ceo-worker');
  });

  it('list() returns every key for the mission', async () => {
    const runtime = createMultiAgentRuntime();
    await runtime.workingMemory.set(ORG, MISSION, 'a', 1, 'w1');
    await runtime.workingMemory.set(ORG, MISSION, 'b', 2, 'w2');
    expect(await runtime.workingMemory.list(ORG, MISSION)).toHaveLength(2);
  });

  it('clear() removes a key', async () => {
    const runtime = createMultiAgentRuntime();
    await runtime.workingMemory.set(ORG, MISSION, 'temp', 'value', 'w1');
    await runtime.workingMemory.clear(ORG, MISSION, 'temp');
    expect(await runtime.workingMemory.get(ORG, MISSION, 'temp')).toBeNull();
  });

  it('keeps different missions isolated', async () => {
    const runtime = createMultiAgentRuntime();
    await runtime.workingMemory.set(ORG, MISSION, 'shared-key', 'mission-1-value', 'w1');
    await runtime.workingMemory.set(ORG, 'mission-2', 'shared-key', 'mission-2-value', 'w2');

    expect((await runtime.workingMemory.get(ORG, MISSION, 'shared-key'))?.value).toBe('mission-1-value');
    expect((await runtime.workingMemory.get(ORG, 'mission-2', 'shared-key'))?.value).toBe('mission-2-value');
  });
});

describe('Integration: Agent Sessions', () => {
  it('start() is idempotent for the same worker+mission', async () => {
    const runtime = createMultiAgentRuntime();
    const first = await runtime.sessions.start(ORG, MISSION, 'worker-1');
    const second = await runtime.sessions.start(ORG, MISSION, 'worker-1');
    expect(second.id).toBe(first.id);
  });

  it('end() removes the session from listActive', async () => {
    const runtime = createMultiAgentRuntime();
    const session = await runtime.sessions.start(ORG, MISSION, 'worker-1');
    await runtime.sessions.end(ORG, session.id);

    const active = await runtime.sessions.listActive(ORG, MISSION);
    expect(active).toHaveLength(0);
  });

  it('touch() updates lastActiveAt without changing status', async () => {
    const runtime = createMultiAgentRuntime();
    const session = await runtime.sessions.start(ORG, MISSION, 'worker-1');
    const touched = await runtime.sessions.touch(ORG, session.id);
    expect(touched.status).toBe('active');
  });

  it('listActive scopes to the mission', async () => {
    const runtime = createMultiAgentRuntime();
    await runtime.sessions.start(ORG, MISSION, 'worker-1');
    await runtime.sessions.start(ORG, 'mission-2', 'worker-2');
    expect(await runtime.sessions.listActive(ORG, MISSION)).toHaveLength(1);
  });
});
