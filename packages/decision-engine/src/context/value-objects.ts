/** @module context/value-objects */
import type { BusinessDnaRef, CapabilityRef, InstitutionalMemoryRef } from './types.js';

/** Bundle of upstream context references. */
export interface ContextReferenceBundle {
  readonly businessDna: readonly BusinessDnaRef[];
  readonly capabilities: readonly CapabilityRef[];
  readonly memory?: InstitutionalMemoryRef;
}
