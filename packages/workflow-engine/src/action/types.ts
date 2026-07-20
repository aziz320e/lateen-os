/** @module action/types */
import type { DecisionId } from '@lateen-os/decision-engine';
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { ActionId, OrganizationId, WorkflowStepId } from '../shared/identifiers.js';
import type { ServiceReference } from '../shared/primitives.js';

export type { ActionId };

export type ActionType = 'notification' | 'service' | 'ai_task' | 'decision';

/** Base side-effect action executed on step completion or transition. */
export interface WorkflowAction {
  readonly actionId: ActionId;
  readonly stepId: WorkflowStepId;
  readonly type: ActionType;
  readonly name: string;
}

/** Send a notification to humans or workers. */
export interface NotificationAction extends WorkflowAction {
  readonly type: 'notification';
  readonly channel: 'in_app' | 'email' | 'webhook' | 'nats';
  readonly recipientEmployeeIds?: readonly string[];
  readonly recipientWorkerIds?: readonly WorkerId[];
  readonly templateCode: string;
  readonly variableKeys: readonly string[];
}

/** Invoke an external service operation. */
export interface ServiceAction extends WorkflowAction {
  readonly type: 'service';
  readonly serviceRef: ServiceReference;
  readonly operation: string;
  readonly inputVariableKeys: readonly string[];
}

/** Schedule an AI worker task via AI Workforce. */
export interface AITaskAction extends WorkflowAction {
  readonly type: 'ai_task';
  readonly workerId: WorkerId;
  readonly taskTemplate: string;
  readonly inputVariableKeys: readonly string[];
}

/** Submit a decision request to the Decision Engine. */
export interface DecisionAction extends WorkflowAction {
  readonly type: 'decision';
  readonly decisionCategory: string;
  readonly titleTemplate: string;
  readonly inputVariableKeys: readonly string[];
  readonly decisionId?: DecisionId;
}

export type { OrganizationId, WorkflowStepId };
