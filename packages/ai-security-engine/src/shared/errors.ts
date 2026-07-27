/** Typed errors used consistently across the AI Security Engine runtime implementations. @module shared/errors */

export class IdentityNotFoundError extends Error {
  constructor(readonly identityId: string) {
    super(`Identity "${identityId}" not found`);
    this.name = 'IdentityNotFoundError';
  }
}

export class InvalidIdentityTransitionError extends Error {
  constructor(
    readonly identityId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Identity "${identityId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidIdentityTransitionError';
  }
}

export class RoleNotFoundError extends Error {
  constructor(readonly roleId: string) {
    super(`Role "${roleId}" not found`);
    this.name = 'RoleNotFoundError';
  }
}

export class PolicyNotFoundError extends Error {
  constructor(readonly policyId: string) {
    super(`Policy "${policyId}" not found`);
    this.name = 'PolicyNotFoundError';
  }
}

export class SecretNotFoundError extends Error {
  constructor(readonly secretId: string) {
    super(`Secret "${secretId}" not found`);
    this.name = 'SecretNotFoundError';
  }
}

export class InvalidSecretTransitionError extends Error {
  constructor(
    readonly secretId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Secret "${secretId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidSecretTransitionError';
  }
}

export class ProviderPolicyNotFoundError extends Error {
  constructor(readonly policyId: string) {
    super(`Provider security policy "${policyId}" not found`);
    this.name = 'ProviderPolicyNotFoundError';
  }
}

export class ToolPolicyNotFoundError extends Error {
  constructor(readonly policyId: string) {
    super(`Tool security policy "${policyId}" not found`);
    this.name = 'ToolPolicyNotFoundError';
  }
}

export class RetentionRuleNotFoundError extends Error {
  constructor(readonly ruleId: string) {
    super(`Retention rule "${ruleId}" not found`);
    this.name = 'RetentionRuleNotFoundError';
  }
}

export class ThreatNotFoundError extends Error {
  constructor(readonly threatId: string) {
    super(`Threat "${threatId}" not found`);
    this.name = 'ThreatNotFoundError';
  }
}
