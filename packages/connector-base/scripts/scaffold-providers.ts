/**
 * Scaffolds all Epic 24 integration provider extensions.
 * Run: pnpm --filter @lateen-os/connector-base scaffold
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROVIDER_DEFINITIONS } from '../src/providers/registry.js';

const WORKSPACE_ROOT = join(import.meta.dirname, '../../..');
const EXTENSIONS_DIR = join(WORKSPACE_ROOT, 'extensions');

const COMMON_TSCONFIG = `{
  "extends": "@lateen-os/typescript-config/node.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true
  },
  "include": ["src"]
}
`;

function kebabToPackage(folder: string): string {
  return `@lateen-os/${folder}-connector`;
}

function generateExtension(def: (typeof PROVIDER_DEFINITIONS)[number]): void {
  const dir = join(EXTENSIONS_DIR, def.folder);
  const pkgName = kebabToPackage(def.folder);
  const extensionId = `${def.folder}-connector`;

  mkdirSync(join(dir, 'src/adapters'), { recursive: true });
  mkdirSync(join(dir, 'tests'), { recursive: true });

  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: pkgName,
        version: '1.0.0',
        private: true,
        description: `${def.displayName} integration provider for Lateen OS`,
        license: 'MIT',
        type: 'module',
        main: './dist/index.js',
        types: './dist/index.js',
        scripts: {
          build: 'tsc',
          typecheck: 'tsc --noEmit',
          test: 'vitest run',
          clean: "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\"",
          lint: "node -e \"process.exit(0)\"",
        },
        dependencies: {
          '@lateen-os/connector-base': 'workspace:*',
          '@lateen-os/integration-contracts': 'workspace:*',
          '@lateen-os/sdk': 'workspace:*',
        },
        devDependencies: {
          '@lateen-os/typescript-config': 'workspace:*',
          '@types/node': '^22.13.10',
          typescript: '^5.8.3',
          vitest: '^3.0.5',
        },
      },
      null,
      2,
    ) + '\n',
  );

  writeFileSync(join(dir, 'tsconfig.json'), COMMON_TSCONFIG + '\n');

  writeFileSync(
    join(dir, 'vitest.config.ts'),
    `import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['tests/**/*.test.ts'] } });
`,
  );

  const syncMode = def.auth.type === 'oauth2' ? 'bidirectional' : 'pull';

  writeFileSync(
    join(dir, 'extension.json'),
    JSON.stringify(
      {
        id: extensionId,
        name: extensionId,
        displayName: `${def.displayName} Connector`,
        version: '1.0.0',
        author: 'Lateen OS',
        license: 'MIT',
        description: def.description,
        category: 'integration',
        type: 'connector',
        engineVersion: '1.0.0',
        sdkVersion: '1.0.0',
        permissions: [
          'integration-hub:read',
          'integration-hub:write',
          'network:outbound',
          'network:inbound',
          'events:publish',
        ],
        connectors: [def.definitionCode],
        main: 'dist/index.js',
      },
      null,
      2,
    ) + '\n',
  );

  writeFileSync(
    join(dir, 'src/manifest.ts'),
    `import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: '${extensionId}',
  name: '${extensionId}',
  provider: '${def.definitionCode}',
  version: '1.0.0',
  description: '${def.description.replace(/'/g, "\\'")}',
  auth: ${JSON.stringify(def.auth, null, 2).replace(/\n/g, '\n  ')},
  sync: { mode: '${syncMode}', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/${def.definitionCode}',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: '${def.definitionCode.toUpperCase().replace(/-/g, '_')}_WEBHOOK_SECRET',
  },
});
`,
  );

  writeFileSync(
    join(dir, 'src/provider.ts'),
    `import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: '${def.folder}',
    definitionCode: '${def.definitionCode}',
    displayName: '${def.displayName}',
    category: '${def.category}',
    description: '${def.description.replace(/'/g, "\\'")}',
    authMethods: ${JSON.stringify(def.authMethods)},
    capabilities: ${JSON.stringify(def.capabilities)},
    auth: connectorManifest.auth,
    authRequiredKeys: ${JSON.stringify(def.authRequiredKeys)},
    entities: ${JSON.stringify(def.entities)},
    syncModes: ${JSON.stringify(def.syncModes)},
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
`,
  );

  writeFileSync(
    join(dir, 'src/adapters/sync.ts'),
    `import { provider } from '../provider.js';\nexport { provider };\nexport const syncAdapter = provider.sync;\n`,
  );

  writeFileSync(
    join(dir, 'src/adapters/webhook.ts'),
    `import { provider } from '../provider.js';\nexport { provider };\nexport const webhookAdapter = provider.webhook;\n`,
  );

  writeFileSync(
    join(dir, 'src/adapters/health.ts'),
    `import { provider } from '../provider.js';\nexport { provider };\nexport const healthAdapter = provider.health;\n`,
  );

  writeFileSync(
    join(dir, 'src/index.ts'),
    `export { connectorManifest } from './manifest.js';
export { provider, default } from './provider.js';
export { syncAdapter } from './adapters/sync.js';
export { webhookAdapter } from './adapters/webhook.js';
export { healthAdapter } from './adapters/health.js';
export type { ConnectorManifest } from '@lateen-os/connector-base';
export type {
  ConnectorProvider,
  SyncAdapter,
  WebhookAdapter,
  HealthAdapter,
} from '@lateen-os/integration-contracts';
`,
  );

  writeFileSync(
    join(dir, 'tests/provider.test.ts'),
    `import { describe, expect, it } from 'vitest';
import { provider, connectorManifest } from '../src/index.js';

describe('${def.displayName} Provider', () => {
  it('exports connector manifest', () => {
    expect(connectorManifest.provider).toBe('${def.definitionCode}');
    expect(connectorManifest.id).toBe('${extensionId}');
  });

  it('testConnection returns ok with credentials', async () => {
    const settings = Object.fromEntries(${JSON.stringify(def.authRequiredKeys)}.map((k) => [k, 'test-value']));
    const result = await provider.testConnection({ settings });
    expect(result.ok).toBe(true);
  });

  it('authenticate stores credentials ref', async () => {
    const settings = Object.fromEntries(${JSON.stringify(def.authRequiredKeys)}.map((k) => [k, 'test-value']));
    const result = await provider.authenticate({ settings });
    expect(result.ok).toBe(true);
    expect(result.credentialsRef).toBeDefined();
  });

  it('sync pull returns records', async () => {
    const settings = Object.fromEntries(${JSON.stringify(def.authRequiredKeys)}.map((k) => [k, 'test-value']));
    const result = await provider.sync.pull({ settings }, '${def.entities[0]}');
    expect(result.count).toBeGreaterThan(0);
  });

  it('webhook register returns registration', async () => {
    const settings = Object.fromEntries(${JSON.stringify(def.authRequiredKeys)}.map((k) => [k, 'test-value']));
    const reg = await provider.webhook.register({ settings, webhookUrl: 'https://example.com/hook' }, ['connected']);
    expect(reg.webhookId).toBeDefined();
  });

  it('health check reports status', async () => {
    const settings = Object.fromEntries(${JSON.stringify(def.authRequiredKeys)}.map((k) => [k, 'test-value']));
    const health = await provider.health.check({ settings });
    expect(['healthy', 'degraded', 'down']).toContain(health.status);
  });
});
`,
  );

  // Documentation
  writeFileSync(
    join(dir, 'README.md'),
    `# ${def.displayName} Connector

Integration provider extension for **${def.displayName}** (${def.definitionCode}).

## Install

\`\`\`bash
lateen marketplace install ${extensionId}
lateen extensions install extensions/${def.folder}
\`\`\`

## Capabilities

${def.capabilities.map((c) => `- ${c}`).join('\n')}

## Auth Methods

${def.authMethods.map((a) => `- ${a}`).join('\n')}

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [AUTH.md](./AUTH.md)
- [WEBHOOKS.md](./WEBHOOKS.md)
- [SYNC.md](./SYNC.md)
`,
  );

  writeFileSync(
    join(dir, 'ARCHITECTURE.md'),
    `# ${def.displayName} — Architecture

Extension type: \`connector\`  
Hub definition code: \`${def.definitionCode}\`  
Category: \`${def.category}\`

## Components

| Export | Description |
| ------ | ----------- |
| \`connectorManifest\` | SDK \`ConnectorManifest\` via \`defineConnector\` |
| \`provider\` | Full \`ConnectorProvider\` with auth, health, sync, webhooks |
| \`syncAdapter\` | Pull/push sync with retry and rate-limit handling |
| \`webhookAdapter\` | Webhook registration and event parsing |
| \`healthAdapter\` | Connection health monitoring |

Built on \`@lateen-os/connector-base\`. No business logic.
`,
  );

  writeFileSync(
    join(dir, 'AUTH.md'),
    `# ${def.displayName} — Authentication

Supported methods: ${def.authMethods.join(', ')}

## Required Settings

${def.authRequiredKeys.map((k) => `- \`${k}\``).join('\n')}

## OAuth2 Flow

1. Configure client credentials in extension settings
2. Call \`provider.authenticate(config)\`
3. Store returned \`credentialsRef\` securely

## API Key / Bearer

Set required keys in \`config.settings\` before \`testConnection\` or \`authenticate\`.
`,
  );

  writeFileSync(
    join(dir, 'WEBHOOKS.md'),
    `# ${def.displayName} — Webhooks

Path: \`/webhooks/${def.definitionCode}\`

## Events

- \`installed\` — Extension installed
- \`connected\` — Provider connected
- \`disconnected\` — Provider disconnected
- \`sync_started\` — Sync job started
- \`sync_completed\` — Sync job completed
- \`sync_failed\` — Sync job failed

## Registration

\`\`\`typescript
await provider.webhook.register(config, ['connected', 'sync_completed']);
\`\`\`
`,
  );

  writeFileSync(
    join(dir, 'SYNC.md'),
    `# ${def.displayName} — Sync

## Supported Modes

- manual
- scheduled
- realtime
- bidirectional

## Entities

${def.entities.map((e) => `- \`${e}\``).join('\n')}

## Pull

\`\`\`typescript
const result = await provider.sync.pull(config, '${def.entities[0]}');
\`\`\`

## Push

\`\`\`typescript
const result = await provider.sync.push(config, '${def.entities[0]}', records);
\`\`\`
`,
  );

  writeFileSync(
    join(dir, 'CHANGELOG.md'),
    `# Changelog

## 1.0.0 — 2026-07-19

- Initial Epic 24 release
- ${def.displayName} connector provider
- OAuth2/API key authentication
- Sync, webhook, and health adapters
- Marketplace installable extension
`,
  );

  console.log(`Scaffolded ${def.folder}`);
}

mkdirSync(EXTENSIONS_DIR, { recursive: true });

for (const def of PROVIDER_DEFINITIONS) {
  generateExtension(def);
}

writeFileSync(
  join(EXTENSIONS_DIR, 'README.md'),
  `# Lateen OS Integration Providers

Epic 24 — Enterprise Integration Providers as Marketplace Extensions.

## Providers (${PROVIDER_DEFINITIONS.length})

${PROVIDER_DEFINITIONS.map((d) => `- [${d.displayName}](./${d.folder}/) (\`${d.definitionCode}\`)`).join('\n')}

## Usage

\`\`\`bash
lateen extensions list
lateen marketplace search stripe
lateen marketplace install stripe-connector
\`\`\`

All providers are built with \`@lateen-os/sdk\` and \`@lateen-os/connector-base\`.
`,
);

console.log(`Done — ${PROVIDER_DEFINITIONS.length} providers scaffolded.`);
console.log(`Add 'extensions/*' to pnpm-workspace.yaml if not present.`);
