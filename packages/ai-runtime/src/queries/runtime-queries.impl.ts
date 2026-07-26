/**
 * Real {@link RuntimeQueries} implementation — a CQRS read layer composed
 * over the abstract repository ports.
 *
 * @module queries/runtime-queries.impl
 */
import type { AgentRepository } from '../agent/repository.js';
import type { TaskRepository } from '../task/repository.js';
import type { RuntimeSessionRepository } from '../runtime/repository.js';
import type { ConversationRepository } from '../conversation/repository.js';
import type { ExecutionPlanRepository, ExecutionResultRepository } from '../execution/repository.js';
import type { RuntimeQueries } from './runtime-queries.js';

export interface RuntimeQueriesDeps {
  readonly agentRepository: AgentRepository;
  readonly taskRepository: TaskRepository;
  readonly runtimeSessionRepository: RuntimeSessionRepository;
  readonly conversationRepository: ConversationRepository;
  readonly executionPlanRepository: ExecutionPlanRepository;
  readonly executionResultRepository: ExecutionResultRepository;
}

/** Creates a {@link RuntimeQueries} read port over the given repositories. */
export function createRuntimeQueries(deps: RuntimeQueriesDeps): RuntimeQueries {
  return {
    async findAgent(query) {
      if (query.runtimeAgentId) {
        const agent = await deps.agentRepository.findById(query.organizationId, query.runtimeAgentId);
        return { agents: agent ? [agent] : [] };
      }
      const active = await deps.agentRepository.findByStatus(query.organizationId, 'idle');
      const running = await deps.agentRepository.findByStatus(query.organizationId, 'running');
      return { agents: [...active, ...running] };
    },

    async findTasks(query) {
      const tasks = query.runtimeAgentId
        ? await deps.taskRepository.findByAgent(query.organizationId, query.runtimeAgentId)
        : query.status
          ? await deps.taskRepository.findByStatus(query.organizationId, query.status)
          : [];
      return { tasks: query.status ? tasks.filter((task) => task.status === query.status) : tasks };
    },

    async findSessions(query) {
      const sessions = query.runtimeAgentId
        ? await deps.runtimeSessionRepository.findByAgent(query.organizationId, query.runtimeAgentId)
        : query.state
          ? await deps.runtimeSessionRepository.findByState(query.organizationId, query.state)
          : [];
      return { sessions: query.state ? sessions.filter((session) => session.state === query.state) : sessions };
    },

    async findConversations(query) {
      if (query.conversationId) {
        const conversation = await deps.conversationRepository.findById(query.organizationId, query.conversationId);
        return { conversations: conversation ? [conversation] : [] };
      }
      if (query.runtimeAgentId) {
        return { conversations: await deps.conversationRepository.findByAgent(query.organizationId, query.runtimeAgentId) };
      }
      return { conversations: [] };
    },

    async findRuntimeState(query) {
      if (query.sessionId) {
        const session = await deps.runtimeSessionRepository.findById(query.organizationId, query.sessionId);
        const queued = await deps.taskRepository.findByStatus(query.organizationId, 'queued');
        return {
          state: session?.state ?? 'terminated',
          activeSessionCount: session && !session.endedAt ? 1 : 0,
          queuedTaskCount: queued.length,
        };
      }
      const [busy, ready, queued] = await Promise.all([
        deps.runtimeSessionRepository.findByState(query.organizationId, 'busy'),
        deps.runtimeSessionRepository.findByState(query.organizationId, 'ready'),
        deps.taskRepository.findByStatus(query.organizationId, 'queued'),
      ]);
      return {
        state: busy.length > 0 ? 'busy' : ready.length > 0 ? 'ready' : 'initializing',
        activeSessionCount: busy.length + ready.length,
        queuedTaskCount: queued.length,
      };
    },

    async findExecutionHistory(query) {
      if (query.planId) {
        return { results: await deps.executionResultRepository.findByPlan(query.organizationId, query.planId) };
      }
      if (query.taskId) {
        const plans = await deps.executionPlanRepository.findByTask(query.organizationId, query.taskId);
        const resultsByPlan = await Promise.all(
          plans.map((plan) => deps.executionResultRepository.findByPlan(query.organizationId, plan.id)),
        );
        return { results: resultsByPlan.flat() };
      }
      return { results: [] };
    },
  };
}
