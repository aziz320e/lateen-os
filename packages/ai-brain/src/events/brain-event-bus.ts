/**
 * Real, typed event bus for AI Brain, built on shared-kernel's generic
 * {@link createEventBus}. Covers the five domain events `Brain.process()`
 * actually publishes.
 *
 * @module events/brain-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';
import type { IntentType } from '../intent/types.js';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint — see ai-runtime's runtime-event-bus.ts.
export type BrainEventMap = {
  'intent.recognized': {
    readonly intentId: string;
    readonly intentType: IntentType;
    readonly summary: string;
    readonly confidenceScore: string;
  };
  'plan.created': { readonly planId: string; readonly intentId: string; readonly summary: string };
  'plan.rejected': { readonly planId: string; readonly intentId: string; readonly reason: string };
  'execution.requested': { readonly planId: string; readonly organizationId: string; readonly requestedBy?: string };
  'reasoning.completed': {
    readonly sessionId: string;
    readonly intentId: string;
    readonly success: boolean;
    readonly stepCount: number;
  };
};

export type BrainEventBus = EventBus<BrainEventMap>;

/** Creates an in-memory {@link BrainEventBus}. */
export function createBrainEventBus(): BrainEventBus {
  return createEventBus<BrainEventMap>();
}
