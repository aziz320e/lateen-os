/** Typed errors used consistently across the AI Governance Engine runtime implementations. @module shared/errors */

export class GovernancePolicyNotFoundError extends Error {
  constructor(readonly policyId: string) {
    super(`Governance policy "${policyId}" not found`);
    this.name = 'GovernancePolicyNotFoundError';
  }
}

export class InvalidPolicyTransitionError extends Error {
  constructor(
    readonly policyId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Governance policy "${policyId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidPolicyTransitionError';
  }
}

export class ModelGovernanceRecordNotFoundError extends Error {
  constructor(readonly modelId: string) {
    super(`Model governance record "${modelId}" not found`);
    this.name = 'ModelGovernanceRecordNotFoundError';
  }
}

export class InvalidModelTransitionError extends Error {
  constructor(
    readonly modelId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Model governance record "${modelId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidModelTransitionError';
  }
}

export class AgentGovernanceRecordNotFoundError extends Error {
  constructor(readonly recordId: string) {
    super(`Agent governance record "${recordId}" not found`);
    this.name = 'AgentGovernanceRecordNotFoundError';
  }
}

export class InvalidAgentTransitionError extends Error {
  constructor(
    readonly recordId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Agent governance record "${recordId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidAgentTransitionError';
  }
}

export class WorkflowGovernanceRecordNotFoundError extends Error {
  constructor(readonly recordId: string) {
    super(`Workflow governance record "${recordId}" not found`);
    this.name = 'WorkflowGovernanceRecordNotFoundError';
  }
}

export class ApprovalRequestNotFoundError extends Error {
  constructor(readonly approvalRequestId: string) {
    super(`Approval request "${approvalRequestId}" not found`);
    this.name = 'ApprovalRequestNotFoundError';
  }
}

export class InvalidApprovalTransitionError extends Error {
  constructor(
    readonly approvalRequestId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Approval request "${approvalRequestId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidApprovalTransitionError';
  }
}

export class RiskNotFoundError extends Error {
  constructor(readonly riskId: string) {
    super(`Risk "${riskId}" not found`);
    this.name = 'RiskNotFoundError';
  }
}

export class InvalidRiskTransitionError extends Error {
  constructor(
    readonly riskId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Risk "${riskId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidRiskTransitionError';
  }
}

export class GovernanceRuleNotFoundError extends Error {
  constructor(readonly ruleId: string) {
    super(`Governance rule "${ruleId}" not found`);
    this.name = 'GovernanceRuleNotFoundError';
  }
}
