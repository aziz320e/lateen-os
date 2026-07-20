/**
 * Enterprise context assembly port.
 *
 * @module context/assembler
 */

import type { Intent } from '../intent/types.js';
import type { BrainSessionId, OrganizationId } from '../shared/identifiers.js';
import type { CorrelationId } from '../shared/primitives.js';
import type { EnterpriseContext } from './types.js';

/** Input for assembling enterprise context. */
export interface ContextAssemblyInput {
  readonly organizationId: OrganizationId;
  readonly sessionId: BrainSessionId;
  readonly correlationId: CorrelationId;
  readonly intent: Intent;
  readonly conversationHistory?: readonly string[];
}

/** Port for assembling enterprise context from platform sources. */
export interface EnterpriseContextAssembler {
  assemble(input: ContextAssemblyInput): Promise<EnterpriseContext>;
}
