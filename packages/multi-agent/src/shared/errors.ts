/** Typed errors used consistently across the Multi-Agent Collaboration Engine's implementations. @module shared/errors */

export class MissionNotFoundError extends Error {
  constructor(readonly missionId: string) {
    super(`Mission "${missionId}" not found`);
    this.name = 'MissionNotFoundError';
  }
}

export class InvalidMissionTransitionError extends Error {
  constructor(
    readonly missionId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Mission "${missionId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidMissionTransitionError';
  }
}

export class AgentNotRegisteredError extends Error {
  constructor(readonly workerId: string) {
    super(`Agent "${workerId}" is not registered for collaboration`);
    this.name = 'AgentNotRegisteredError';
  }
}

export class AgentUnavailableError extends Error {
  constructor(readonly workerId: string) {
    super(`Agent "${workerId}" is not available`);
    this.name = 'AgentUnavailableError';
  }
}

export class NoSuitableAgentError extends Error {
  constructor(readonly role: string) {
    super(`No available agent found for role "${role}"`);
    this.name = 'NoSuitableAgentError';
  }
}

export class DelegationDepthExceededError extends Error {
  constructor(
    readonly missionId: string,
    readonly maxDepth: number,
  ) {
    super(`Mission "${missionId}" delegation chain exceeds max depth ${maxDepth}`);
    this.name = 'DelegationDepthExceededError';
  }
}

export class DelegationPolicyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DelegationPolicyViolationError';
  }
}

export class ConflictNotFoundError extends Error {
  constructor(readonly conflictId: string) {
    super(`Conflict "${conflictId}" not found`);
    this.name = 'ConflictNotFoundError';
  }
}

export class ConflictAlreadyResolvedError extends Error {
  constructor(readonly conflictId: string) {
    super(`Conflict "${conflictId}" is already resolved`);
    this.name = 'ConflictAlreadyResolvedError';
  }
}

export class ConsensusNotReachedError extends Error {
  constructor(readonly missionId: string) {
    super(`Consensus was not reached for mission "${missionId}"`);
    this.name = 'ConsensusNotReachedError';
  }
}

export class SessionNotFoundError extends Error {
  constructor(readonly sessionId: string) {
    super(`Agent session "${sessionId}" not found`);
    this.name = 'SessionNotFoundError';
  }
}

export class NotFoundError extends Error {
  constructor(
    readonly entity: string,
    readonly id: string,
  ) {
    super(`${entity} "${id}" not found`);
    this.name = 'NotFoundError';
  }
}
