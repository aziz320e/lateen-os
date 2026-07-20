/** @module escalation/repository */
import type { Repository } from '../shared/repository.js';
import type {
  EscalationDecision,
  EscalationDecisionId,
  EscalationRequest,
  EscalationRequestId,
} from './types.js';

export type EscalationRequestRepository = Repository<EscalationRequest, EscalationRequestId>;
export type EscalationDecisionRepository = Repository<EscalationDecision, EscalationDecisionId>;
