/**
 * Working memory port.
 *
 * @module memory/working-memory
 */

import type { EnterpriseContext } from '../context/types.js';
import type { Intent } from '../intent/types.js';
import type { BrainSessionId, OrganizationId } from '../shared/identifiers.js';
import type { WorkingContext } from './types.js';

/** Input for working memory retrieval. */
export interface WorkingMemoryInput {
  readonly organizationId: OrganizationId;
  readonly sessionId: BrainSessionId;
  readonly intent: Intent;
  readonly context: EnterpriseContext;
  readonly query?: string;
}

/** Port for retrieving and maintaining working context during reasoning. */
export interface WorkingMemory {
  retrieve(input: WorkingMemoryInput): Promise<WorkingContext>;
}
