/** @module policy/types */
import { z } from 'zod';
import type { ModelId, PolicyId, ProviderId } from '../shared/identifiers.js';
import type { ProviderKind } from '../provider/types.js';

export const providerPolicySchema = z.object({
  maxCostUsd: z.string().optional(),
  maxTokens: z.number().int().positive().optional(),
  allowedProviders: z.array(z.string()).optional(),
  allowedModels: z.array(z.string()).optional(),
  allowedProviderKinds: z.array(z.string()).optional(),
  blockSensitiveData: z.boolean().default(true),
  piiProtection: z.boolean().default(true),
  requireLocalProviders: z.boolean().default(false),
});

export type ProviderPolicy = z.infer<typeof providerPolicySchema>;

export interface PolicyEvaluation {
  readonly policyId: PolicyId;
  readonly allowed: boolean;
  readonly violations: readonly string[];
  readonly sanitized: boolean;
}

export interface PolicyContext {
  readonly organizationId: string;
  readonly providerId?: ProviderId;
  readonly modelId?: ModelId;
  readonly providerKind?: ProviderKind;
  readonly promptContent?: string;
  readonly estimatedTokens?: number;
  readonly estimatedCostUsd?: string;
}

export interface PolicyEnforcer {
  evaluate(context: PolicyContext, policy: ProviderPolicy): PolicyEvaluation;
  sanitizeContent(content: string): string;
}
