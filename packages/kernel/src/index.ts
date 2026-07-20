/**
 * @lateen-os/kernel — Lateen Kernel
 *
 * Platform operating layer for Lateen OS. Bootstraps, configures, monitors,
 * and manages the Lateen platform lifecycle.
 *
 * @packageDocumentation
 */

export * from './bootstrap/index.js';
export * from './configuration/index.js';
export * from './lifecycle/index.js';
export * from './dependency/index.js';
export * from './registry/index.js';
export * from './plugins/index.js';
export * from './health/index.js';
export * from './monitor/index.js';
export * from './diagnostics/index.js';
export * from './environment/index.js';
export * from './workspace/index.js';
export * from './events/index.js';

export { runCli } from './cli/program.js';

export { PLATFORM_MANIFEST } from './registry/manifest.js';
export { bootstrapPlatform } from './bootstrap/bootstrap.js';
export { createLifecycleManager } from './lifecycle/manager.js';
export { createHealthChecker } from './health/checker.js';
export { createDiagnosticsDoctor } from './diagnostics/doctor.js';
