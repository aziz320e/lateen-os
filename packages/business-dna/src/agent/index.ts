/**
 * Agent aggregate — AI Workforce workers (Reactive + Proactive modes).
 * @module agent
 */
export * from './types.js';
export * from './value-objects.js';
export * from './events.js';
export * from './repository.js';

/** Schema-aligned alias for the Agent aggregate (AI Agent in Business DNA schema). */
export type { Agent as AiAgent } from './types.js';
