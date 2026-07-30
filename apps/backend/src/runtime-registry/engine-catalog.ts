/**
 * Static metadata for every package under `packages/*` — the platform's
 * complete engine catalog. This is descriptive data only; it never
 * duplicates any engine's business logic. Layer grouping and hosting
 * disposition are drawn from `docs/AI_PROJECT_CONTEXT.md` §3 and the
 * Commit 35 certification (`docs/certification/RUNTIME_AUDIT.md`).
 *
 * `hosted: true` means the Runtime Registry actually constructs this
 * engine's runtime (see `runtime-registry.service.ts`). `hosted: false`
 * entries are real, existing packages that are deliberately not
 * instantiated here, each for a specific, documented reason (no runtime
 * object to construct, requires real external configuration, or is a
 * pure contract/tooling package) — not an oversight.
 */
export type EngineLayer =
  | 'foundation'
  | 'llm-abstraction'
  | 'reasoning'
  | 'coordination'
  | 'domain-infrastructure'
  | 'business'
  | 'trust'
  | 'horizontal'
  | 'platform-surface'
  | 'developer-surface';

export interface EngineCatalogEntry {
  readonly name: string;
  readonly packageName: string;
  readonly layer: EngineLayer;
  readonly hosted: boolean;
  readonly reason?: string;
}

export const ENGINE_CATALOG: readonly EngineCatalogEntry[] = [
  {
    name: 'shared-kernel',
    packageName: '@lateen-os/shared-kernel',
    layer: 'foundation',
    hosted: false,
    reason: 'Primitives library — no runtime object.',
  },
  {
    name: 'ai-provider-hub',
    packageName: '@lateen-os/ai-provider-hub',
    layer: 'llm-abstraction',
    hosted: false,
    reason: 'createAiProviderHub() requires real provider configuration.',
  },
  {
    name: 'decision-engine',
    packageName: '@lateen-os/decision-engine',
    layer: 'reasoning',
    hosted: false,
    reason: 'Documented sanctioned deviation — no unified runtime object.',
  },
  {
    name: 'intelligence-engine',
    packageName: '@lateen-os/intelligence-engine',
    layer: 'reasoning',
    hosted: false,
    reason: 'Documented sanctioned deviation — no unified runtime object.',
  },
  {
    name: 'ai-runtime',
    packageName: '@lateen-os/ai-runtime',
    layer: 'reasoning',
    hosted: false,
    reason: 'Documented sanctioned deviation — no unified runtime object.',
  },
  { name: 'ai-brain', packageName: '@lateen-os/ai-brain', layer: 'reasoning', hosted: true },
  { name: 'ceo-engine', packageName: '@lateen-os/ceo-engine', layer: 'reasoning', hosted: true },
  {
    name: 'workflow-engine',
    packageName: '@lateen-os/workflow-engine',
    layer: 'coordination',
    hosted: true,
  },
  {
    name: 'multi-agent',
    packageName: '@lateen-os/multi-agent',
    layer: 'coordination',
    hosted: true,
  },
  {
    name: 'ai-workforce',
    packageName: '@lateen-os/ai-workforce',
    layer: 'coordination',
    hosted: true,
  },
  {
    name: 'business-dna',
    packageName: '@lateen-os/business-dna',
    layer: 'domain-infrastructure',
    hosted: true,
  },
  {
    name: 'institutional-memory',
    packageName: '@lateen-os/institutional-memory',
    layer: 'domain-infrastructure',
    hosted: true,
  },
  {
    name: 'domain-graph',
    packageName: '@lateen-os/domain-graph',
    layer: 'domain-infrastructure',
    hosted: true,
  },
  {
    name: 'capability-engine',
    packageName: '@lateen-os/capability-engine',
    layer: 'domain-infrastructure',
    hosted: false,
    reason: 'No composition root — nothing to compose.',
  },
  { name: 'crm-engine', packageName: '@lateen-os/crm-engine', layer: 'business', hosted: true },
  { name: 'sales-engine', packageName: '@lateen-os/sales-engine', layer: 'business', hosted: true },
  {
    name: 'marketing-engine',
    packageName: '@lateen-os/marketing-engine',
    layer: 'business',
    hosted: true,
  },
  {
    name: 'communication-hub',
    packageName: '@lateen-os/communication-hub',
    layer: 'business',
    hosted: true,
  },
  {
    name: 'finance-engine',
    packageName: '@lateen-os/finance-engine',
    layer: 'business',
    hosted: true,
  },
  { name: 'hr-engine', packageName: '@lateen-os/hr-engine', layer: 'business', hosted: true },
  {
    name: 'inventory-engine',
    packageName: '@lateen-os/inventory-engine',
    layer: 'business',
    hosted: true,
  },
  {
    name: 'project-management-engine',
    packageName: '@lateen-os/project-management-engine',
    layer: 'business',
    hosted: true,
  },
  {
    name: 'customer-success-engine',
    packageName: '@lateen-os/customer-success-engine',
    layer: 'business',
    hosted: true,
  },
  {
    name: 'document-management-engine',
    packageName: '@lateen-os/document-management-engine',
    layer: 'business',
    hosted: true,
  },
  {
    name: 'ai-security-engine',
    packageName: '@lateen-os/ai-security-engine',
    layer: 'trust',
    hosted: true,
  },
  {
    name: 'ai-governance-engine',
    packageName: '@lateen-os/ai-governance-engine',
    layer: 'trust',
    hosted: true,
  },
  {
    name: 'ai-compliance-engine',
    packageName: '@lateen-os/ai-compliance-engine',
    layer: 'trust',
    hosted: true,
  },
  {
    name: 'analytics-engine',
    packageName: '@lateen-os/analytics-engine',
    layer: 'horizontal',
    hosted: true,
  },
  {
    name: 'observability-engine',
    packageName: '@lateen-os/observability-engine',
    layer: 'horizontal',
    hosted: true,
  },
  {
    name: 'api-gateway',
    packageName: '@lateen-os/api-gateway',
    layer: 'platform-surface',
    hosted: true,
  },
  {
    name: 'admin-console',
    packageName: '@lateen-os/admin-console',
    layer: 'platform-surface',
    hosted: true,
  },
  {
    name: 'marketplace',
    packageName: '@lateen-os/marketplace-engine',
    layer: 'platform-surface',
    hosted: true,
  },
  {
    name: 'sdk',
    packageName: '@lateen-os/sdk',
    layer: 'developer-surface',
    hosted: false,
    reason:
      'A composition of a subset of the engines above (createLateen()), not a distinct engine.',
  },
  {
    name: 'kernel',
    packageName: '@lateen-os/kernel',
    layer: 'developer-surface',
    hosted: false,
    reason: 'Exposes a one-shot bootstrapPlatform(), not a persistent runtime.',
  },
  {
    name: 'extension-system',
    packageName: '@lateen-os/extension-system',
    layer: 'developer-surface',
    hosted: true,
  },
  {
    name: 'connector-base',
    packageName: '@lateen-os/connector-base',
    layer: 'developer-surface',
    hosted: false,
    reason: 'Contract-only package — no runtime state.',
  },
  {
    name: 'integration-contracts',
    packageName: '@lateen-os/integration-contracts',
    layer: 'developer-surface',
    hosted: false,
    reason: 'Contract-only package — no runtime state.',
  },
  {
    name: 'typescript-config',
    packageName: '@lateen-os/typescript-config',
    layer: 'developer-surface',
    hosted: false,
    reason: 'Shared tsconfig only — no runtime source.',
  },
  {
    name: 'integration-tests',
    packageName: '@lateen-os/integration-tests',
    layer: 'developer-surface',
    hosted: false,
    reason: 'A test harness, not a composable engine.',
  },
];
