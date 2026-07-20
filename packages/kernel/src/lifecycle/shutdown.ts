/** @module lifecycle/shutdown */
import type { KernelEventBus } from '../events/bus.js';
import type { KernelLogger } from '../bootstrap/logger.js';
import { shutdownKernelTelemetry } from '../bootstrap/telemetry.js';
import type { ProcessManager } from './process-manager.js';

export interface GracefulShutdownOptions {
  readonly timeoutMs: number;
}

export async function gracefulShutdown(
  processManager: ProcessManager,
  events: KernelEventBus,
  logger: KernelLogger,
  options: GracefulShutdownOptions,
): Promise<void> {
  events.emit('kernel.stopping');
  logger.info({ timeoutMs: options.timeoutMs }, 'graceful shutdown started');

  processManager.stop();

  await new Promise((resolve) => setTimeout(resolve, Math.min(options.timeoutMs, 2_000)));

  await shutdownKernelTelemetry();

  events.emit('kernel.shutdown');
  logger.info('graceful shutdown completed');
}
