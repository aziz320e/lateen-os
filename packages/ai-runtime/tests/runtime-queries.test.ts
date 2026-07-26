import { describe, expect, it } from 'vitest';
import { createRuntimeQueries } from '../src/queries/runtime-queries.impl.js';
import { createAgentRepository } from '../src/agent/repository.impl.js';
import { createTaskRepository } from '../src/task/repository.impl.js';
import { createRuntimeSessionRepository } from '../src/runtime/repository.impl.js';
import { createConversationRepository } from '../src/conversation/repository.impl.js';
import { createExecutionPlanRepository, createExecutionResultRepository } from '../src/execution/repository.impl.js';
import type { Task } from '../src/task/types.js';
import type { RuntimeSession } from '../src/runtime/types.js';
import type { ExecutionPlan, ExecutionResult } from '../src/execution/types.js';

const ORG = 'org-1';
const now = new Date().toISOString();

function buildQueries(seed: { tasks?: readonly Task[]; sessions?: readonly RuntimeSession[]; plans?: readonly ExecutionPlan[]; results?: readonly ExecutionResult[] } = {}) {
  return createRuntimeQueries({
    agentRepository: createAgentRepository(),
    taskRepository: createTaskRepository(seed.tasks),
    runtimeSessionRepository: createRuntimeSessionRepository(seed.sessions),
    conversationRepository: createConversationRepository(),
    executionPlanRepository: createExecutionPlanRepository(seed.plans),
    executionResultRepository: createExecutionResultRepository(seed.results),
  });
}

describe('createRuntimeQueries', () => {
  it('findTasks by status returns only matching tasks', async () => {
    const queued: Task = { id: 't1', organizationId: ORG, createdAt: now, updatedAt: now, title: 'A', runtimeAgentId: 'a1', priority: 'normal', status: 'queued' };
    const completed: Task = { id: 't2', organizationId: ORG, createdAt: now, updatedAt: now, title: 'B', runtimeAgentId: 'a1', priority: 'normal', status: 'completed' };
    const queries = buildQueries({ tasks: [queued, completed] });

    const result = await queries.findTasks({ organizationId: ORG, status: 'queued' });
    expect(result.tasks).toEqual([queued]);
  });

  it('findRuntimeState with a sessionId reports that session state', async () => {
    const session: RuntimeSession = { id: 's1', organizationId: ORG, createdAt: now, updatedAt: now, runtimeAgentId: 'a1', state: 'busy', context: { sessionId: 's1' }, startedAt: now };
    const queries = buildQueries({ sessions: [session] });

    const result = await queries.findRuntimeState({ organizationId: ORG, sessionId: 's1' });
    expect(result.state).toBe('busy');
    expect(result.activeSessionCount).toBe(1);
  });

  it('findRuntimeState with no sessionId aggregates across sessions', async () => {
    const busy: RuntimeSession = { id: 's1', organizationId: ORG, createdAt: now, updatedAt: now, runtimeAgentId: 'a1', state: 'busy', context: { sessionId: 's1' }, startedAt: now };
    const queries = buildQueries({ sessions: [busy] });

    const result = await queries.findRuntimeState({ organizationId: ORG });
    expect(result.state).toBe('busy');
    expect(result.activeSessionCount).toBe(1);
  });

  it('findExecutionHistory by taskId joins through execution plans', async () => {
    const plan: ExecutionPlan = { id: 'p1', organizationId: ORG, createdAt: now, updatedAt: now, taskId: 't1', steps: [], status: 'completed' };
    const result: ExecutionResult = { id: 'r1', organizationId: ORG, createdAt: now, updatedAt: now, planId: 'p1', context: { sessionId: 's1', taskId: 't1', startedAt: now }, success: true, completedAt: now };
    const queries = buildQueries({ plans: [plan], results: [result] });

    const history = await queries.findExecutionHistory({ organizationId: ORG, taskId: 't1' });
    expect(history.results).toEqual([result]);
  });

  it('findExecutionHistory with neither taskId nor planId returns empty', async () => {
    const queries = buildQueries();
    const history = await queries.findExecutionHistory({ organizationId: ORG });
    expect(history.results).toEqual([]);
  });
});
