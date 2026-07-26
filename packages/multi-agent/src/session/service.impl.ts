/**
 * Real Agent Session service — join/leave semantics for a worker's live
 * engagement within a mission.
 *
 * @module session/service.impl
 */
import type { CollaborationEventBus } from '../events/collaboration-event-bus.js';
import { SessionNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, MissionId } from '../shared/identifiers.js';
import type { AgentSessionRepository } from './repository.js';
import type { AgentSession, AgentSessionId, WorkerId } from './types.js';

export interface AgentSessionService {
  /** Starts a session, or returns the existing active one for this worker+mission (idempotent). */
  start(organizationId: OrganizationId, missionId: MissionId, workerId: WorkerId): Promise<AgentSession>;
  end(organizationId: OrganizationId, sessionId: AgentSessionId): Promise<AgentSession>;
  touch(organizationId: OrganizationId, sessionId: AgentSessionId): Promise<AgentSession>;
  listActive(organizationId: OrganizationId, missionId: MissionId): Promise<readonly AgentSession[]>;
}

/** Creates a real {@link AgentSessionService} backed by an {@link AgentSessionRepository}. */
export function createAgentSessionService(repository: AgentSessionRepository, eventBus?: CollaborationEventBus): AgentSessionService {
  return {
    async start(organizationId, missionId, workerId) {
      const existing = await repository.findActiveByWorker(organizationId, missionId, workerId);
      if (existing) return existing;

      const now = nowIso();
      const session: AgentSession = {
        id: generateId('agent-session'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        missionId,
        workerId,
        status: 'active',
        startedAt: now,
        lastActiveAt: now,
      };
      await repository.save(session);
      eventBus?.publish('session.started', { sessionId: session.id, missionId, workerId });
      return session;
    },

    async end(organizationId, sessionId) {
      const session = await repository.findById(organizationId, sessionId);
      if (!session) throw new SessionNotFoundError(sessionId);
      const now = nowIso();
      const ended: AgentSession = { ...session, status: 'ended', endedAt: now, updatedAt: now };
      await repository.save(ended);
      eventBus?.publish('session.ended', { sessionId });
      return ended;
    },

    async touch(organizationId, sessionId) {
      const session = await repository.findById(organizationId, sessionId);
      if (!session) throw new SessionNotFoundError(sessionId);
      const now = nowIso();
      const touched: AgentSession = { ...session, lastActiveAt: now, updatedAt: now };
      await repository.save(touched);
      return touched;
    },

    async listActive(organizationId, missionId) {
      return (await repository.findByMission(organizationId, missionId)).filter((session) => session.status === 'active');
    },
  };
}
