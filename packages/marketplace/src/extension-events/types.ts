/** @module extension-events/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { EventDeclarationId, ExtensionId } from '../shared/identifiers.js';

export type { EventDeclarationId };

export type EventDeclarationDirection = 'subscribes' | 'publishes';

/** A declared event interest for one extension — metadata only, never a live subscription onto the runtime event bus. */
export interface EventDeclaration extends TenantAuditableEntity<EventDeclarationId> {
  readonly extensionId: ExtensionId;
  readonly eventName: string;
  readonly direction: EventDeclarationDirection;
}
