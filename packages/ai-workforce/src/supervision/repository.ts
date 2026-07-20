/** @module supervision/repository */
import type { Repository } from '../shared/repository.js';
import type { Escalation, EscalationId, Review, ReviewId, Supervisor, SupervisorId } from './types.js';

export type SupervisorRepository = Repository<Supervisor, SupervisorId>;
export type ReviewRepository = Repository<Review, ReviewId>;
export type EscalationRepository = Repository<Escalation, EscalationId>;
