/** @module bootstrap/types */
import type { KernelConfig } from '../configuration/schema.js';
import type { KernelLogger } from './logger.js';
import type { KernelEventBus } from '../events/bus.js';
import type { PluginLoadResult } from '../plugins/loader.js';
import type { EnvironmentValidationResult } from '../environment/validator.js';

export interface BootstrapResult {
  readonly config: KernelConfig;
  readonly logger: KernelLogger;
  readonly events: KernelEventBus;
  readonly startupOrder: readonly string[];
  readonly plugins: PluginLoadResult;
  readonly environment: EnvironmentValidationResult;
}
