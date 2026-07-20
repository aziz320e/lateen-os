/** @module reasoning/context */
import type { EnterpriseContext } from '../context/types.js';
import type { WorkingContext } from '../memory/types.js';
import type { ReasoningSessionId } from '../shared/identifiers.js';

/** Context bundle active during a reasoning session. */
export interface ReasoningContext {
  readonly sessionId: ReasoningSessionId;
  readonly enterprise: EnterpriseContext;
  readonly working: WorkingContext;
  readonly focusAreas: readonly string[];
}
