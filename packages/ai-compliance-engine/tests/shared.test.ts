import { describe, expect, it } from 'vitest';
import { generateId, nowIso } from '../src/shared/id.js';
import {
  ComplianceFrameworkNotFoundError,
  InvalidFrameworkTransitionError,
  ComplianceControlNotFoundError,
  InvalidControlTransitionError,
  ControlMappingNotFoundError,
  ComplianceAssessmentNotFoundError,
  RemediationNotFoundError,
  InvalidRemediationTransitionError,
  ComplianceAuditNotFoundError,
  InvalidAuditTransitionError,
  ComplianceRetentionRuleNotFoundError,
  ComplianceReportNotFoundError,
} from '../src/shared/errors.js';

describe('generateId (pure)', () => {
  it('prefixes the id with the given string', () => {
    expect(generateId('compliance-framework')).toMatch(/^compliance-framework-/);
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
  it('ComplianceFrameworkNotFoundError and InvalidFrameworkTransitionError carry the framework id', () => {
    expect(new ComplianceFrameworkNotFoundError('fw-1').frameworkId).toBe('fw-1');
    expect(new InvalidFrameworkTransitionError('fw-1', 'archived', 'active').frameworkId).toBe('fw-1');
  });

  it('ComplianceControlNotFoundError and InvalidControlTransitionError carry the control id', () => {
    expect(new ComplianceControlNotFoundError('c-1').controlId).toBe('c-1');
    expect(new InvalidControlTransitionError('c-1', 'retired', 'approved').controlId).toBe('c-1');
  });

  it('ControlMappingNotFoundError carries the mapping id', () => {
    expect(new ControlMappingNotFoundError('m-1').mappingId).toBe('m-1');
  });

  it('ComplianceAssessmentNotFoundError carries the assessment id', () => {
    expect(new ComplianceAssessmentNotFoundError('a-1').assessmentId).toBe('a-1');
  });

  it('RemediationNotFoundError and InvalidRemediationTransitionError carry the remediation id', () => {
    expect(new RemediationNotFoundError('r-1').remediationId).toBe('r-1');
    expect(new InvalidRemediationTransitionError('r-1', 'completed', 'open').remediationId).toBe('r-1');
  });

  it('ComplianceAuditNotFoundError and InvalidAuditTransitionError carry the audit id', () => {
    expect(new ComplianceAuditNotFoundError('aud-1').auditId).toBe('aud-1');
    expect(new InvalidAuditTransitionError('aud-1', 'completed', 'planned').auditId).toBe('aud-1');
  });

  it('ComplianceRetentionRuleNotFoundError carries the rule id', () => {
    expect(new ComplianceRetentionRuleNotFoundError('rule-1').ruleId).toBe('rule-1');
  });

  it('ComplianceReportNotFoundError carries the report id', () => {
    expect(new ComplianceReportNotFoundError('rep-1').reportId).toBe('rep-1');
  });
});
