/**
 * Real {@link PolicyEnforcer} implementation — evaluates constraints from a
 * {@link ProviderPolicy} against a request {@link PolicyContext}, and does
 * basic secret/PII redaction.
 *
 * @module policy/policy.impl
 */
import { randomUUID } from 'node:crypto';
import type { PolicyContext, PolicyEnforcer, PolicyEvaluation, ProviderPolicy } from './types.js';

const LOCAL_PROVIDER_KINDS = new Set(['ollama', 'llama-cpp']);

// Non-global variant for stateless boolean checks; global variant for substitution.
const SECRET_LIKE_PATTERN = /\b(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/;
const SECRET_LIKE_PATTERN_GLOBAL = /\b(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;

/** Creates a {@link PolicyEnforcer} that evaluates real constraint checks and redacts obvious secrets/emails. */
export function createPolicyEnforcer(): PolicyEnforcer {
  return {
    evaluate(context: PolicyContext, policy: ProviderPolicy): PolicyEvaluation {
      const violations: string[] = [];

      if (policy.allowedProviders?.length && context.providerId && !policy.allowedProviders.includes(context.providerId)) {
        violations.push(`Provider "${context.providerId}" is not in the allowed providers list`);
      }
      if (policy.allowedModels?.length && context.modelId && !policy.allowedModels.includes(context.modelId)) {
        violations.push(`Model "${context.modelId}" is not in the allowed models list`);
      }
      if (
        policy.allowedProviderKinds?.length &&
        context.providerKind &&
        !policy.allowedProviderKinds.includes(context.providerKind)
      ) {
        violations.push(`Provider kind "${context.providerKind}" is not in the allowed provider kinds list`);
      }
      if (
        policy.maxTokens !== undefined &&
        context.estimatedTokens !== undefined &&
        context.estimatedTokens > policy.maxTokens
      ) {
        violations.push(`Estimated tokens (${context.estimatedTokens}) exceed policy maxTokens (${policy.maxTokens})`);
      }
      if (
        policy.maxCostUsd !== undefined &&
        context.estimatedCostUsd !== undefined &&
        parseFloat(context.estimatedCostUsd) > parseFloat(policy.maxCostUsd)
      ) {
        violations.push(
          `Estimated cost (${context.estimatedCostUsd}) exceeds policy maxCostUsd (${policy.maxCostUsd})`,
        );
      }
      if (policy.requireLocalProviders && context.providerKind && !LOCAL_PROVIDER_KINDS.has(context.providerKind)) {
        violations.push(`Policy requires a local provider, but "${context.providerKind}" is not local`);
      }

      const containsSensitiveData = policy.blockSensitiveData && context.promptContent
        ? SECRET_LIKE_PATTERN.test(context.promptContent)
        : false;
      if (containsSensitiveData) {
        violations.push('Prompt content appears to contain sensitive data (API key or email)');
      }

      const sanitized = policy.piiProtection && !!context.promptContent && SECRET_LIKE_PATTERN.test(context.promptContent);

      return {
        policyId: randomUUID(),
        allowed: violations.length === 0,
        violations,
        sanitized,
      };
    },
    sanitizeContent(content: string): string {
      return content.replace(SECRET_LIKE_PATTERN_GLOBAL, '[REDACTED]');
    },
  };
}
