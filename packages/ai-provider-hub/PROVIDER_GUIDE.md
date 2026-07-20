# Provider Guide

## Registration

Providers are registered via the `ProviderRegistry` port:

```typescript
import type { ProviderRegistry, ProviderRegistration } from '@lateen-os/ai-provider-hub';

const registration: ProviderRegistration = {
  metadata: PROVIDER_CATALOG[0],
  configuration: { apiKeyRef: 'vault:openai-key' },
  status: 'active',
  priority: 1,
};

registry.register(registration);
```

## Configuration

| Field | Description |
| ----- | ----------- |
| `apiKeyRef` | Vault/secrets reference (never inline keys) |
| `baseUrl` | Override default endpoint |
| `organization` | Provider organization ID |
| `deploymentName` | Azure deployment name |
| `timeoutMs` | Request timeout |
| `maxRetries` | Retry count |

## Health Checks

Use `ProviderHealth` port:

```typescript
const health = await providerHealth.check('openai');
// { status: 'active', latencyMs: 120, ... }
```

## Routing

```typescript
import { applyRoutingStrategy } from '@lateen-os/ai-provider-hub';

const decision = applyRoutingStrategy(
  {
    capability: 'chat-completion',
    policy: { strategy: 'cheapest' },
  },
  {
    providerLatencies: { openai: 200, anthropic: 350 },
    providerCosts: { openai: '0.001', anthropic: '0.003' },
    providerHealth: { openai: 'healthy', anthropic: 'healthy' },
  },
);
```

## Fallback Configuration

```typescript
const fallbackPolicy: FallbackPolicy = {
  triggers: ['provider-unavailable', 'rate-limited', 'timeout'],
  chain: {
    id: 'default-chain',
    steps: [
      { providerId: 'openai', modelId: 'gpt-4o', priority: 1 },
      { providerId: 'anthropic', modelId: 'claude-sonnet-4', priority: 2 },
    ],
    maxRetries: 2,
    retryDelayMs: 500,
  },
  retryOnTimeout: true,
  retryOnRateLimit: true,
};
```

## Policies

```typescript
import { providerPolicySchema } from '@lateen-os/ai-provider-hub';

const policy = providerPolicySchema.parse({
  maxCostUsd: '100.00',
  maxTokens: 1_000_000,
  allowedProviderKinds: ['openai', 'anthropic'],
  piiProtection: true,
  blockSensitiveData: true,
});
```

## Events

| Event | Description |
| ----- | ----------- |
| `provider.selected` | Provider/model chosen |
| `provider.failed` | Request failed |
| `provider.fallback` | Fallback triggered |
| `provider.request.completed` | Request succeeded with metrics |
| `provider.budget.exceeded` | Organization budget exceeded |
| `provider.policy.violated` | Policy enforcement blocked request |

## Future Adapters

Provider SDK implementations will live in separate adapter packages or extensions — never in `@lateen-os/ai-provider-hub`. The hub defines the contract surface that adapters must implement.
