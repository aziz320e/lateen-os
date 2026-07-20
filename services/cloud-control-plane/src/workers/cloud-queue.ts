import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';

export interface CloudJob {
  readonly id: string;
  readonly type: string;
  readonly tenantId?: string;
  readonly queuedAt: string;
}

export interface CloudQueuePort {
  enqueue(type: string, tenantId?: string): Promise<CloudJob>;
  close?(): Promise<void>;
}

export class InMemoryCloudQueue implements CloudQueuePort {
  async enqueue(type: string, tenantId?: string): Promise<CloudJob> {
    return { id: randomUUID(), type, tenantId, queuedAt: new Date().toISOString() };
  }
}

export class BullMqCloudQueue implements CloudQueuePort {
  private readonly queue: Queue;
  private readonly memory = new InMemoryCloudQueue();

  constructor(redisUrl: string) {
    this.queue = new Queue('cloud-jobs', { connection: { url: redisUrl } });
  }

  async enqueue(type: string, tenantId?: string): Promise<CloudJob> {
    const job = await this.memory.enqueue(type, tenantId);
    await this.queue.add(type, { tenantId }, { jobId: job.id });
    return job;
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export function createCloudQueue(useRedis: boolean, redisUrl: string): CloudQueuePort {
  return useRedis ? new BullMqCloudQueue(redisUrl) : new InMemoryCloudQueue();
}
