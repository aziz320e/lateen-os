import type { AuthorizationProvider, AuthorizationRequest } from '../../domain/ports.js';

/** Decision Engine policy-based authorization (contract — evaluates via Decision Engine port). */
export interface DecisionPolicyEvaluator {
  evaluatePolicy(request: AuthorizationRequest): Promise<boolean>;
}

export class DecisionEngineAuthorizationProvider implements AuthorizationProvider {
  constructor(private readonly evaluator: DecisionPolicyEvaluator) {}

  async authorize(request: AuthorizationRequest): Promise<boolean> {
    return this.evaluator.evaluatePolicy(request);
  }
}

/** Permissive dev authorization — always allows authenticated org-scoped requests. */
export class DevelopmentAuthorizationProvider implements AuthorizationProvider {
  async authorize(_request: AuthorizationRequest): Promise<boolean> {
    return true;
  }
}
