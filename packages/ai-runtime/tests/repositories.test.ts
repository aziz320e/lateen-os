import { describe, expect, it } from 'vitest';
import { createAgentRepository } from '../src/agent/repository.impl.js';
import { createTaskRepository } from '../src/task/repository.impl.js';
import { createConversationRepository } from '../src/conversation/repository.impl.js';
import { createWorkingMemoryRepository } from '../src/memory/repository.impl.js';
import { createToolRepository, createToolCallRepository } from '../src/tooling/repository.impl.js';
import { createScheduleRepository } from '../src/scheduler/repository.impl.js';
import { createExecutionPlanRepository, createExecutionResultRepository } from '../src/execution/repository.impl.js';
import { createMultiAgentWorkflowRepository } from '../src/orchestrator/repository.impl.js';
import { createPlanRepository } from '../src/planner/repository.impl.js';
import { createRuntimeSessionRepository } from '../src/runtime/repository.impl.js';
import type { Agent } from '../src/agent/types.js';
import type { Task } from '../src/task/types.js';
import type { Conversation } from '../src/conversation/types.js';
import type { WorkingMemory } from '../src/memory/types.js';
import type { Tool, ToolCall } from '../src/tooling/types.js';
import type { Schedule } from '../src/scheduler/types.js';
import type { ExecutionPlan, ExecutionResult } from '../src/execution/types.js';
import type { MultiAgentWorkflow } from '../src/orchestrator/types.js';
import type { Plan } from '../src/planner/types.js';
import type { RuntimeSession } from '../src/runtime/types.js';

const ORG = 'org-1';
const now = new Date().toISOString();

describe('createAgentRepository', () => {
  const agent: Agent = {
    id: 'a1', organizationId: ORG, createdAt: now, updatedAt: now,
    businessDnaAgentId: 'bdna-1', profile: { displayName: 'Agent', workforceType: 'ceo_ai', proactiveEnabled: true, reactiveEnabled: true },
    roles: [], capabilities: [], status: 'idle', lifecycle: 'activated',
  };

  it('findByBusinessDnaAgentId and findByStatus work', async () => {
    const repo = createAgentRepository([agent]);
    await expect(repo.findByBusinessDnaAgentId(ORG, 'bdna-1')).resolves.toEqual(agent);
    await expect(repo.findByStatus(ORG, 'idle')).resolves.toHaveLength(1);
    await expect(repo.findByStatus(ORG, 'running')).resolves.toHaveLength(0);
  });
});

describe('createTaskRepository', () => {
  const task: Task = {
    id: 't1', organizationId: ORG, createdAt: now, updatedAt: now,
    title: 'Do work', runtimeAgentId: 'a1', priority: 'normal', status: 'queued',
  };

  it('findByAgent and findByStatus work', async () => {
    const repo = createTaskRepository([task]);
    await expect(repo.findByAgent(ORG, 'a1')).resolves.toHaveLength(1);
    await expect(repo.findByStatus(ORG, 'queued')).resolves.toHaveLength(1);
    await expect(repo.findByStatus(ORG, 'completed')).resolves.toHaveLength(0);
  });
});

describe('createConversationRepository', () => {
  const conversation: Conversation = {
    id: 'c1', organizationId: ORG, createdAt: now, updatedAt: now,
    runtimeAgentId: 'a1', threads: [],
  };

  it('findByAgent works', async () => {
    const repo = createConversationRepository([conversation]);
    await expect(repo.findByAgent(ORG, 'a1')).resolves.toHaveLength(1);
  });
});

describe('createWorkingMemoryRepository', () => {
  const memory: WorkingMemory = {
    id: 'm1', organizationId: ORG, createdAt: now, updatedAt: now,
    sessionId: 's1', contextWindow: { references: [] }, entries: [],
  };

  it('findBySession works', async () => {
    const repo = createWorkingMemoryRepository([memory]);
    await expect(repo.findBySession(ORG, 's1')).resolves.toEqual(memory);
    await expect(repo.findBySession(ORG, 'missing')).resolves.toBeNull();
  });
});

describe('createToolRepository and createToolCallRepository', () => {
  const tool: Tool = {
    id: 'tool1', organizationId: ORG, createdAt: now, updatedAt: now,
    descriptor: { toolId: 'tool1', name: 'Search' }, enabled: true,
  };
  const call: ToolCall = {
    id: 'call1', organizationId: ORG, createdAt: now, updatedAt: now,
    toolId: 'tool1', runtimeAgentId: 'a1', input: {}, requestedAt: now,
  };

  it('tool repository stores and finds by id', async () => {
    const repo = createToolRepository([tool]);
    await expect(repo.findById(ORG, 'tool1')).resolves.toEqual(tool);
  });

  it('tool call repository findByTool works', async () => {
    const repo = createToolCallRepository([call]);
    await expect(repo.findByTool(ORG, 'tool1')).resolves.toHaveLength(1);
    await expect(repo.findByTool(ORG, 'other')).resolves.toHaveLength(0);
  });
});

describe('createScheduleRepository', () => {
  const schedule: Schedule = {
    id: 'sch1', organizationId: ORG, createdAt: now, updatedAt: now,
    taskId: 't1', runtimeAgentId: 'a1', trigger: { type: 'manual' }, enabled: true,
  };

  it('findByAgent works', async () => {
    const repo = createScheduleRepository([schedule]);
    await expect(repo.findByAgent(ORG, 'a1')).resolves.toHaveLength(1);
  });
});

describe('createExecutionPlanRepository and createExecutionResultRepository', () => {
  const plan: ExecutionPlan = { id: 'ep1', organizationId: ORG, createdAt: now, updatedAt: now, taskId: 't1', steps: [], status: 'ready' };
  const result: ExecutionResult = { id: 'er1', organizationId: ORG, createdAt: now, updatedAt: now, planId: 'ep1', context: { sessionId: 's1', taskId: 't1', startedAt: now }, success: true, completedAt: now };

  it('findByTask and findByPlan work', async () => {
    const planRepo = createExecutionPlanRepository([plan]);
    const resultRepo = createExecutionResultRepository([result]);
    await expect(planRepo.findByTask(ORG, 't1')).resolves.toHaveLength(1);
    await expect(resultRepo.findByPlan(ORG, 'ep1')).resolves.toHaveLength(1);
  });
});

describe('createMultiAgentWorkflowRepository', () => {
  const workflow: MultiAgentWorkflow = {
    id: 'w1', organizationId: ORG, createdAt: now, updatedAt: now,
    name: 'Launch', coordinator: { leadAgentId: 'a1', participantAgentIds: [] }, planIds: [], status: 'draft',
  };

  it('stores and finds by id', async () => {
    const repo = createMultiAgentWorkflowRepository([workflow]);
    await expect(repo.findById(ORG, 'w1')).resolves.toEqual(workflow);
  });
});

describe('createPlanRepository', () => {
  const plan: Plan = { id: 'p1', organizationId: ORG, createdAt: now, updatedAt: now, taskId: 't1', runtimeAgentId: 'a1', steps: [] };

  it('findByTask works', async () => {
    const repo = createPlanRepository([plan]);
    await expect(repo.findByTask(ORG, 't1')).resolves.toHaveLength(1);
  });
});

describe('createRuntimeSessionRepository', () => {
  const session: RuntimeSession = {
    id: 's1', organizationId: ORG, createdAt: now, updatedAt: now,
    runtimeAgentId: 'a1', state: 'ready', context: { sessionId: 's1' }, startedAt: now,
  };

  it('findByAgent, findActiveByAgent, and findByState work', async () => {
    const repo = createRuntimeSessionRepository([session]);
    await expect(repo.findByAgent(ORG, 'a1')).resolves.toHaveLength(1);
    await expect(repo.findActiveByAgent(ORG, 'a1')).resolves.toEqual(session);
    await expect(repo.findByState(ORG, 'ready')).resolves.toHaveLength(1);
  });
});
