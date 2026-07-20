/**
 * Agent value objects — Proactive AI operating modes.
 * @module agent/value-objects
 */

/** Reactive + Proactive mode configuration per Architecture v1.0. */
export interface AgentOperatingModes {
  readonly proactiveEnabled: boolean;
  readonly reactiveEnabled: boolean;
}
