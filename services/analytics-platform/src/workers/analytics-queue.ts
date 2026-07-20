import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';

export interface AnalyticsJob {
  readonly id: string;
  readonly organizationId: string;
  readonly dashboardId?: string;
  readonly queuedAt: string;
}

export interface AnalyticsQueuePort {
  enqueue(organizationId: string, dashboardId?: string): Promise<AnalyticsJob>;
  close?(): Promise<void>;
}

export class InMemoryAnalyticsQueue implements AnalyticsQueuePort {
  async enqueue(organizationId: string, dashboardId?: string): Promise<AnalyticsJob> {
    return { id: randomUUID(), organizationId, dashboardId, queuedAt: new Date().toISOString() };
  }
}

export class BullMqAnalyticsQueue implements AnalyticsQueuePort {
  private readonly queue: Queue;
  private readonly memory = new InMemoryAnalyticsQueue();

  constructor(redisUrl: string) {
    this.queue = new Queue('analytics-jobs', { connection: { url: redisUrl } });
  }

  async enqueue(organizationId: string, dashboardId?: string): Promise<AnalyticsJob> {
    const job = await this.memory.enqueue(organizationId, dashboardId);
    await this.queue.add('aggregate', { organizationId, dashboardId }, { jobId: job.id });
    return job;
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export function createAnalyticsQueue(useRedis: boolean, redisUrl: string): AnalyticsQueuePort {
  return useRedis ? new BullMqAnalyticsQueue(redisUrl) : new InMemoryAnalyticsQueue();
}
