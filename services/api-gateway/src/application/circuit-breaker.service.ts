import type { AppConfig } from '../config/index';
import type { CircuitState } from '../domain/types';

const CIRCUIT_OPEN_MS = 30_000;
const CIRCUIT_FAILURE_THRESHOLD = 5;

export class CircuitBreakerService {
  private readonly states = new Map<string, CircuitState>();

  constructor(private readonly config: AppConfig) {}

  canRequest(serviceName: string): boolean {
    const state = this.states.get(serviceName);
    if (!state?.openedAt) return true;
    if (Date.now() - state.openedAt >= CIRCUIT_OPEN_MS) {
      state.openedAt = undefined;
      state.halfOpenAt = Date.now();
      state.failures = 0;
      return true;
    }
    return false;
  }

  recordSuccess(serviceName: string): void {
    this.states.set(serviceName, { failures: 0 });
  }

  recordFailure(serviceName: string): void {
    const current = this.states.get(serviceName) ?? { failures: 0 };
    const failures = current.failures + 1;
    const next: CircuitState = { failures };
    if (failures >= CIRCUIT_FAILURE_THRESHOLD) {
      next.openedAt = Date.now();
    }
    this.states.set(serviceName, next);
  }

  getState(serviceName: string): CircuitState {
    return this.states.get(serviceName) ?? { failures: 0 };
  }

  getTimeoutMs(): number {
    return this.config.REQUEST_TIMEOUT_MS;
  }
}
