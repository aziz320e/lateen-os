/** @module business-profile/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type BusinessProfileEventName = DomainEventName<'business-profile', 'updated'>;

export type BusinessProfileDomainEvent = DomainEvent<'business-profile.updated', Record<string, unknown>>;
