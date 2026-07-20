/** @module document/value-objects */
import type { DocumentType } from './types.js';

/** External document locator (URI or storage key — not implemented here). */
export interface DocumentLocator {
  readonly documentType: DocumentType;
  readonly externalUri?: string;
}
