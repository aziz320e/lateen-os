/** @module risk/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { RiskLevel } from './types.js';

export type RiskAssessmentEventName =
  | DomainEventName<'risk_assessment', 'created'>
  | DomainEventName<'risk_assessment', 'updated'>
  | DomainEventName<'risk_assessment', 'escalated'>;

export type RiskAssessmentDomainEvent =
  | DomainEvent<'risk_assessment.created', { readonly overallLevel: RiskLevel }>
  | DomainEvent<'risk_assessment.updated', Record<string, unknown>>
  | DomainEvent<'risk_assessment.escalated', Record<string, unknown>>;
