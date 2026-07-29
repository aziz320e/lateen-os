/**
 * Real Extension Events engine — declared subscriptions and
 * publications for an extension's event interests, plus deterministic
 * compatibility checking against a known event-name catalog. This is
 * metadata bookkeeping only — never a live subscription onto any
 * runtime event bus.
 *
 * @module extension-events/engine.impl
 */
import type { MarketplaceEventBus } from '../events/marketplace-event-bus.js';
import { EventDeclarationNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { EventDeclarationId, ExtensionId, OrganizationId } from '../shared/identifiers.js';
import type { EventDeclarationRepository } from './repository.js';
import type { EventDeclaration } from './types.js';

export interface DeclareEventInput {
  readonly extensionId: ExtensionId;
  readonly eventName: string;
}

export interface EventCompatibilityResult {
  readonly compatible: boolean;
  readonly unknownEvents: readonly string[];
}

export interface ExtensionEventsEngine {
  declareSubscription(organizationId: OrganizationId, input: DeclareEventInput): Promise<EventDeclaration>;
  declarePublication(organizationId: OrganizationId, input: DeclareEventInput): Promise<EventDeclaration>;
  removeDeclaration(organizationId: OrganizationId, eventDeclarationId: EventDeclarationId): Promise<void>;
  checkEventCompatibility(organizationId: OrganizationId, extensionId: ExtensionId, knownEventNames: readonly string[]): Promise<EventCompatibilityResult>;
  listSubscriptions(organizationId: OrganizationId, extensionId: ExtensionId): Promise<readonly EventDeclaration[]>;
  listPublications(organizationId: OrganizationId, extensionId: ExtensionId): Promise<readonly EventDeclaration[]>;
  getDeclaration(organizationId: OrganizationId, eventDeclarationId: EventDeclarationId): Promise<EventDeclaration | null>;
}

/** Creates a real {@link ExtensionEventsEngine}. */
export function createExtensionEventsEngine(repository: EventDeclarationRepository, eventBus?: MarketplaceEventBus, now: () => string = nowIso): ExtensionEventsEngine {
  async function declare(organizationId: OrganizationId, input: DeclareEventInput, direction: 'subscribes' | 'publishes'): Promise<EventDeclaration> {
    const timestamp = now();
    const declaration: EventDeclaration = {
      id: generateId('marketplace-event-declaration'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      extensionId: input.extensionId,
      eventName: input.eventName,
      direction,
    };
    await repository.save(declaration);
    return declaration;
  }

  return {
    async declareSubscription(organizationId, input) {
      return declare(organizationId, input, 'subscribes');
    },

    async declarePublication(organizationId, input) {
      return declare(organizationId, input, 'publishes');
    },

    async removeDeclaration(organizationId, eventDeclarationId) {
      const declaration = await repository.findById(organizationId, eventDeclarationId);
      if (!declaration) throw new EventDeclarationNotFoundError(eventDeclarationId);
      await repository.delete(organizationId, eventDeclarationId);
    },

    async checkEventCompatibility(organizationId, extensionId, knownEventNames) {
      const declarations = await repository.findByExtension(organizationId, extensionId);
      const unknownEvents = [...new Set(declarations.map((declaration) => declaration.eventName).filter((eventName) => !knownEventNames.includes(eventName)))];
      const compatible = unknownEvents.length === 0;
      eventBus?.publish('compatibility.checked', { organizationId, subjectId: extensionId, compatible });
      return { compatible, unknownEvents };
    },

    async listSubscriptions(organizationId, extensionId) {
      const declarations = await repository.findByExtension(organizationId, extensionId);
      return declarations.filter((declaration) => declaration.direction === 'subscribes');
    },

    async listPublications(organizationId, extensionId) {
      const declarations = await repository.findByExtension(organizationId, extensionId);
      return declarations.filter((declaration) => declaration.direction === 'publishes');
    },

    async getDeclaration(organizationId, eventDeclarationId) {
      return repository.findById(organizationId, eventDeclarationId);
    },
  };
}
