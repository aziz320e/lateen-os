/** @module negotiation/repository */
import type { Repository } from '../shared/repository.js';
import type { Negotiation, NegotiationId, NegotiationRound, NegotiationRoundId } from './types.js';

export type NegotiationRepository = Repository<Negotiation, NegotiationId>;
export type NegotiationRoundRepository = Repository<NegotiationRound, NegotiationRoundId>;
