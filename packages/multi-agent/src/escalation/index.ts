export * from './types.js';
export * from './repository.js';
export { createEscalationRequestRepository, createEscalationDecisionRepository } from './repository.impl.js';
export { createEscalationService, type EscalationService, type EscalationServiceDeps } from './service.impl.js';
