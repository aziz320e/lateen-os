/** @module events/workflow-events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type WorkflowEventName =
  | DomainEventName<'workflow', 'defined'>
  | DomainEventName<'workflow', 'published'>
  | DomainEventName<'workflow', 'deprecated'>;

export type WorkflowDefinitionDomainEvent =
  | DomainEvent<'workflow.defined', { readonly code: string; readonly name: string }>
  | DomainEvent<'workflow.published', { readonly version: string }>
  | DomainEvent<'workflow.deprecated', Record<string, unknown>>;

export type WorkflowInstanceEventName =
  | DomainEventName<'workflow_instance', 'started'>
  | DomainEventName<'workflow_instance', 'completed'>
  | DomainEventName<'workflow_instance', 'failed'>
  | DomainEventName<'workflow_instance', 'cancelled'>
  | DomainEventName<'workflow_instance', 'suspended'>
  | DomainEventName<'workflow_instance', 'resumed'>;

export type WorkflowInstanceDomainEvent =
  | DomainEvent<'workflow_instance.started', { readonly definitionCode: string }>
  | DomainEvent<'workflow_instance.completed', Record<string, unknown>>
  | DomainEvent<'workflow_instance.failed', { readonly errorMessage: string }>
  | DomainEvent<'workflow_instance.cancelled', { readonly reason: string }>
  | DomainEvent<'workflow_instance.suspended', { readonly reason: string }>
  | DomainEvent<'workflow_instance.resumed', Record<string, unknown>>;

export type StepEventName =
  | DomainEventName<'step', 'started'>
  | DomainEventName<'step', 'completed'>
  | DomainEventName<'step', 'failed'>
  | DomainEventName<'step', 'waiting'>;

export type StepDomainEvent =
  | DomainEvent<'step.started', { readonly stepCode: string; readonly stepType: string }>
  | DomainEvent<'step.completed', Record<string, unknown>>
  | DomainEvent<'step.failed', { readonly errorMessage: string }>
  | DomainEvent<'step.waiting', { readonly waitingFor: string }>;

export type ApprovalEventName =
  | DomainEventName<'approval', 'requested'>
  | DomainEventName<'approval', 'approved'>
  | DomainEventName<'approval', 'rejected'>;

export type ApprovalDomainEvent =
  | DomainEvent<'approval.requested', { readonly title: string }>
  | DomainEvent<'approval.approved', { readonly approverId: string }>
  | DomainEvent<'approval.rejected', { readonly approverId: string; readonly reason?: string }>;

/** Union of all Workflow Engine domain events. */
export type WorkflowEngineDomainEvent =
  | WorkflowDefinitionDomainEvent
  | WorkflowInstanceDomainEvent
  | StepDomainEvent
  | ApprovalDomainEvent;
