/** Typed errors used consistently across AI Brain's implementations. @module shared/errors */

export class PlanNotFoundError extends Error {
  constructor(readonly planId: string) {
    super(`Execution plan "${planId}" not found`);
    this.name = 'PlanNotFoundError';
  }
}

export class DecisionExplanationNotFoundError extends Error {
  constructor(readonly decisionId: string) {
    super(`No reasoning session references decision "${decisionId}"`);
    this.name = 'DecisionExplanationNotFoundError';
  }
}

export class MissionExplanationNotFoundError extends Error {
  constructor(readonly missionId: string) {
    super(`No reasoning session references mission "${missionId}"`);
    this.name = 'MissionExplanationNotFoundError';
  }
}
