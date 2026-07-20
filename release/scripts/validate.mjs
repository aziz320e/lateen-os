#!/usr/bin/env node
/**
 * Lateen OS RC validation — phased build/typecheck/test.
 * Workaround for turbo cyclic dependency (kernel ↔ sdk ↔ extension-system).
 * Usage: node release/scripts/validate.mjs [--skip-build]
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../..');
const SKIP_BUILD = process.argv.includes('--skip-build');

const PHASES = [
  {
    name: 'foundation',
    packages: [
      '@lateen-os/typescript-config',
      '@lateen-os/shared-kernel',
      '@lateen-os/business-dna',
      '@lateen-os/domain-graph',
      '@lateen-os/institutional-memory',
      '@lateen-os/decision-engine',
      '@lateen-os/intelligence-engine',
      '@lateen-os/capability-engine',
      '@lateen-os/ai-brain',
      '@lateen-os/ai-runtime',
      '@lateen-os/ai-workforce',
      '@lateen-os/workflow-engine',
      '@lateen-os/multi-agent',
      '@lateen-os/ai-provider-hub',
      '@lateen-os/connector-base',
      '@lateen-os/integration-contracts',
    ],
  },
  {
    name: 'platform-core',
    packages: ['@lateen-os/sdk', '@lateen-os/extension-system', '@lateen-os/kernel'],
  },
  {
    name: 'services',
    packages: [
      '@lateen-os/business-dna-service',
      '@lateen-os/identity-service',
      '@lateen-os/product-discovery-service',
      '@lateen-os/integration-hub',
      '@lateen-os/mission-scheduler',
      '@lateen-os/marketplace-service',
      '@lateen-os/provisioning-service',
      '@lateen-os/api-gateway-service',
      '@lateen-os/knowledge-platform-service',
      '@lateen-os/search-platform-service',
      '@lateen-os/analytics-platform-service',
      '@lateen-os/cloud-control-plane-service',
    ],
  },
  {
    name: 'applications',
    packages: [
      '@lateen-os/ai-product-manager',
      '@lateen-os/business-dna-studio',
      '@lateen-os/ceo-cockpit',
      '@lateen-os/customer-portal',
      '@lateen-os/lateen-assistant',
      '@lateen-os/marketplace',
      '@lateen-os/setup-wizard',
      '@lateen-os/admin-gateway',
      '@lateen-os/search-center',
      '@lateen-os/ai-studio',
      '@lateen-os/automation-studio',
      '@lateen-os/analytics-center',
      '@lateen-os/cloud-console',
    ],
  },
];

const results = [];

function run(cmd, pkg) {
  const started = Date.now();
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
    return { pkg, cmd, status: 'pass', durationMs: Date.now() - started };
  } catch (e) {
    const err = e;
    return {
      pkg,
      cmd,
      status: 'fail',
      durationMs: Date.now() - started,
      error: (err.stderr || err.stdout || err.message || '').slice(0, 500),
    };
  }
}

console.log('Lateen OS Enterprise v1.0.0-rc.1 — Validation\n');

for (const phase of PHASES) {
  console.log(`\n=== Phase: ${phase.name} ===`);
  for (const pkg of phase.packages) {
    if (!SKIP_BUILD) {
      const build = run(`pnpm --filter ${pkg} build`, pkg);
      results.push({ phase: phase.name, ...build, step: 'build' });
      console.log(`  ${build.status === 'pass' ? '✓' : '✗'} build ${pkg} (${build.durationMs}ms)`);
      if (build.status === 'fail') continue;
    }
    const tc = run(`pnpm --filter ${pkg} typecheck`, pkg);
    results.push({ phase: phase.name, ...tc, step: 'typecheck' });
    console.log(`  ${tc.status === 'pass' ? '✓' : '✗'} typecheck ${pkg} (${tc.durationMs}ms)`);
    const test = run(`pnpm --filter ${pkg} test`, pkg);
    results.push({ phase: phase.name, ...test, step: 'test' });
    console.log(`  ${test.status === 'pass' ? '✓' : '✗'} test ${pkg} (${test.durationMs}ms)`);
  }
}

const passed = results.filter((r) => r.status === 'pass').length;
const failed = results.filter((r) => r.status === 'fail').length;

const report = {
  version: '1.0.0-rc.1',
  generatedAt: new Date().toISOString(),
  summary: { total: results.length, passed, failed },
  results,
};

mkdirSync(join(ROOT, 'quality'), { recursive: true });
writeFileSync(join(ROOT, 'quality', 'validation-results.json'), JSON.stringify(report, null, 2));

console.log(`\n=== Summary: ${passed}/${results.length} passed, ${failed} failed ===`);
writeFileSync(
  join(ROOT, 'quality', 'validation-summary.txt'),
  `Lateen OS v1.0.0-rc.1 Validation\nPassed: ${passed}\nFailed: ${failed}\nTotal: ${results.length}\n`,
);

process.exit(failed > 0 ? 1 : 0);
