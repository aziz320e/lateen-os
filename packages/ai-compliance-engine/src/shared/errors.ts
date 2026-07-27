/** Typed errors used consistently across the AI Compliance Engine runtime implementations. @module shared/errors */

export class ComplianceFrameworkNotFoundError extends Error {
  constructor(readonly frameworkId: string) {
    super(`Compliance framework "${frameworkId}" not found`);
    this.name = 'ComplianceFrameworkNotFoundError';
  }
}

export class InvalidFrameworkTransitionError extends Error {
  constructor(
    readonly frameworkId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Compliance framework "${frameworkId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidFrameworkTransitionError';
  }
}

export class ComplianceControlNotFoundError extends Error {
  constructor(readonly controlId: string) {
    super(`Compliance control "${controlId}" not found`);
    this.name = 'ComplianceControlNotFoundError';
  }
}

export class InvalidControlTransitionError extends Error {
  constructor(
    readonly controlId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Compliance control "${controlId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidControlTransitionError';
  }
}

export class ControlMappingNotFoundError extends Error {
  constructor(readonly mappingId: string) {
    super(`Control mapping "${mappingId}" not found`);
    this.name = 'ControlMappingNotFoundError';
  }
}

export class ComplianceAssessmentNotFoundError extends Error {
  constructor(readonly assessmentId: string) {
    super(`Compliance assessment "${assessmentId}" not found`);
    this.name = 'ComplianceAssessmentNotFoundError';
  }
}

export class RemediationNotFoundError extends Error {
  constructor(readonly remediationId: string) {
    super(`Remediation "${remediationId}" not found`);
    this.name = 'RemediationNotFoundError';
  }
}

export class InvalidRemediationTransitionError extends Error {
  constructor(
    readonly remediationId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Remediation "${remediationId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidRemediationTransitionError';
  }
}

export class ComplianceAuditNotFoundError extends Error {
  constructor(readonly auditId: string) {
    super(`Compliance audit "${auditId}" not found`);
    this.name = 'ComplianceAuditNotFoundError';
  }
}

export class InvalidAuditTransitionError extends Error {
  constructor(
    readonly auditId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Compliance audit "${auditId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidAuditTransitionError';
  }
}

export class ComplianceRetentionRuleNotFoundError extends Error {
  constructor(readonly ruleId: string) {
    super(`Compliance retention rule "${ruleId}" not found`);
    this.name = 'ComplianceRetentionRuleNotFoundError';
  }
}

export class ComplianceReportNotFoundError extends Error {
  constructor(readonly reportId: string) {
    super(`Compliance report "${reportId}" not found`);
    this.name = 'ComplianceReportNotFoundError';
  }
}
