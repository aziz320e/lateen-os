/** @module monitor/monitor */
import type { Logger } from 'pino';
import type { KernelConfig } from '../configuration/schema.js';
import { createHealthChecker } from '../health/checker.js';
import type { PlatformHealthReport } from '../health/types.js';

export interface MonitorOptions {
  readonly intervalMs?: number;
  readonly onReport?: (report: PlatformHealthReport) => void;
}

export class PlatformMonitor {
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly config: KernelConfig,
    private readonly logger: Logger,
  ) {}

  start(options: MonitorOptions = {}): void {
    const intervalMs = options.intervalMs ?? 30_000;
    const checker = createHealthChecker(this.config);

    this.timer = setInterval(async () => {
      const report = await checker.collectReport();
      this.logger.info({ status: report.status }, 'platform health tick');
      options.onReport?.(report);
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}

export function createPlatformMonitor(config: KernelConfig, logger: Logger): PlatformMonitor {
  return new PlatformMonitor(config, logger);
}
