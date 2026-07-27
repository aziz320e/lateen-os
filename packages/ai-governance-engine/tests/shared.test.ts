import { describe, expect, it } from 'vitest';
import { generateId, nowIso } from '../src/shared/id.js';
import {
  GovernancePolicyNotFoundError,
  InvalidPolicyTransitionError,
  ModelGovernanceRecordNotFoundError,
  InvalidModelTransitionError,
  AgentGovernanceRecordNotFoundError,
  InvalidAgentTransitionError,
  WorkflowGovernanceRecordNotFoundError,
  ApprovalRequestNotFoundError,
  InvalidApprovalTransitionError,
  RiskNotFoundError,
  InvalidRiskTransitionError,
  GovernanceRuleNotFoundError,
} from '../src/shared/errors.js';

describe('generateId (pure)', () => {
  it('prefixes the id with the given string', () => {
    expect(generateId('governance-policy')).toMatch(/^governance-policy-/);
  });

  it('generates unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('x')));
    expect(ids.size).toBe(50);
  });
});

describe('nowIso (pure)', () => {
  it('returns a valid ISO 8601 date-time string', () => {
    const value = nowIso();
    expect(new Date(value).toISOString()).toBe(value);
  });
});

describe('typed errors', () => {
  it('GovernancePolicyNotFoundError carries the policy id and a descriptive message', () => {
    const error = new GovernancePolicyNotFoundError('policy-1');
    expect(error.name).toBe('GovernancePolicyNotFoundError');
    expect(error.policyId).toBe('policy-1');
    expect(error.message).toContain('policy-1');
  });

  it('InvalidPolicyTransitionError carries from/to', () => {
    const error = new InvalidPolicyTransitionError('policy-1', 'archived', 'active');
    expect(error.from).toBe('archived');
    expect(error.to).toBe('active');
  });

  it('ModelGovernanceRecordNotFoundError and InvalidModelTransitionError carry the model id', () => {
    expect(new ModelGovernanceRecordNotFoundError('gpt-4').modelId).toBe('gpt-4');
    expect(new InvalidModelTransitionError('gpt-4', 'deprecated', 'approved').modelId).toBe('gpt-4');
  });

  it('AgentGovernanceRecordNotFoundError and InvalidAgentTransitionError carry the record id', () => {
    expect(new AgentGovernanceRecordNotFoundError('rec-1').recordId).toBe('rec-1');
    expect(new InvalidAgentTransitionError('rec-1', 'retired', 'approved').recordId).toBe('rec-1');
  });

  it('WorkflowGovernanceRecordNotFoundError carries the record id', () => {
    expect(new WorkflowGovernanceRecordNotFoundError('rec-1').recordId).toBe('rec-1');
  });

  it('ApprovalRequestNotFoundError and InvalidApprovalTransitionError carry the request id', () => {
    expect(new ApprovalRequestNotFoundError('req-1').approvalRequestId).toBe('req-1');
    expect(new InvalidApprovalTransitionError('req-1', 'approved', 'rejected').approvalRequestId).toBe('req-1');
  });

  it('RiskNotFoundError and InvalidRiskTransitionError carry the risk id', () => {
    expect(new RiskNotFoundError('risk-1').riskId).toBe('risk-1');
    expect(new InvalidRiskTransitionError('risk-1', 'closed', 'open').riskId).toBe('risk-1');
  });

  it('GovernanceRuleNotFoundError carries the rule id', () => {
    expect(new GovernanceRuleNotFoundError('rule-1').ruleId).toBe('rule-1');
  });
});
