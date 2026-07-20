import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';

export interface ProvisioningQueueJob {
  readonly id: string;
  readonly provisioningJobId: string;
  readonly queuedAt: string;
}

export interface ProvisioningQueuePort {
  enqueue(provisioningJobId: string): Promise<ProvisioningQueueJob>;
  close?(): Promise<void>;
}

export class InMemoryProvisioningQueue implements ProvisioningQueuePort {
  private readonly jobs: ProvisioningQueueJob[] = [];

  async enqueue(provisioningJobId: string): Promise<ProvisioningQueueJob> {
    const job: ProvisioningQueueJob = {
      id: randomUUID(),
      provisioningJobId,
      queuedAt: new Date().toISOString(),
    };
    this.jobs.push(job);
    return job;
  }
}

export class BullMqProvisioningQueue implements ProvisioningQueuePort {
  private readonly queue: Queue;
  private readonly memory = new InMemoryProvisioningQueue();

  constructor(redisUrl: string) {
    this.queue = new Queue('provisioning-jobs', { connection: { url: redisUrl } });
  }

  async enqueue(provisioningJobId: string): Promise<ProvisioningQueueJob> {
    const job = await this.memory.enqueue(provisioningJobId);
    await this.queue.add('provision', { provisioningJobId }, { jobId: job.id });
    return job;
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export function createProvisioningQueue(useRedis: boolean, redisUrl: string): ProvisioningQueuePort {
  return useRedis ? new BullMqProvisioningQueue(redisUrl) : new InMemoryProvisioningQueue();
}
