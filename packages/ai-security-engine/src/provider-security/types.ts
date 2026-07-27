/** @module provider-security/types */
import type { ModelId, ProviderCapability, ProviderKind } from '@lateen-os/ai-provider-hub';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ProviderPolicyId } from '../shared/identifiers.js';

export type { ProviderPolicyId, ModelId, ProviderCapability, ProviderKind };

export type ProviderPolicyStatus = 'active' | 'archived';

/** A deterministic allow/deny policy over AI Provider Hub providers, models, and capabilities. Deny always takes precedence over allow. */
export interface ProviderSecurityPolicy extends TenantAuditableEntity<ProviderPolicyId> {
  readonly name: string;
  readonly status: ProviderPolicyStatus;
  readonly allowedProviders: readonly ProviderKind[];
  readonly deniedProviders: readonly ProviderKind[];
  readonly allowedModels: readonly ModelId[];
  readonly deniedModels: readonly ModelId[];
  readonly allowedCapabilities: readonly ProviderCapability[];
  readonly deniedCapabilities: readonly ProviderCapability[];
}

export interface EvaluateProviderRequest {
  readonly providerKind: ProviderKind;
  readonly modelId?: ModelId;
  readonly capabilities?: readonly ProviderCapability[];
}

export interface ProviderRequestEvaluation {
  readonly allowed: boolean;
  readonly reason?: string;
}

export type { OrganizationId } from '../shared/identifiers.js';
