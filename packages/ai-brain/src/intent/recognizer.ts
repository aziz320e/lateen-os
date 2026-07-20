/**
 * Intent recognition port.
 *
 * Implementations live outside this package. No LLM SDK or business logic here.
 *
 * @module intent/recognizer
 */

import type { BrainSessionId, OrganizationId } from '../shared/identifiers.js';
import type { Intent } from './types.js';

/** Input for intent recognition. */
export interface IntentRecognitionInput {
  readonly organizationId: OrganizationId;
  readonly sessionId: BrainSessionId;
  readonly rawInput: string;
  readonly language?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Port for recognizing user or system intent from input. */
export interface IntentRecognizer {
  recognize(input: IntentRecognitionInput): Promise<Intent>;
}
