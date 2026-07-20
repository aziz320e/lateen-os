import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';

export interface SearchIndexJob {
  readonly id: string;
  readonly organizationId: string;
  readonly source: string;
  readonly queuedAt: string;
}

export interface SearchIndexQueuePort {
  enqueue(organizationId: string, source: string): Promise<SearchIndexJob>;
  close?(): Promise<void>;
}

export class InMemorySearchIndexQueue implements SearchIndexQueuePort {
  async enqueue(organizationId: string, source: string): Promise<SearchIndexJob> {
    return { id: randomUUID(), organizationId, source, queuedAt: new Date().toISOString() };
  }
}

export class BullMqSearchIndexQueue implements SearchIndexQueuePort {
  private readonly queue: Queue;
  private readonly memory = new InMemorySearchIndexQueue();

  constructor(redisUrl: string) {
    this.queue = new Queue('search-index-jobs', { connection: { url: redisUrl } });
  }

  async enqueue(organizationId: string, source: string): Promise<SearchIndexJob> {
    const job = await this.memory.enqueue(organizationId, source);
    await this.queue.add('index', { organizationId, source }, { jobId: job.id });
    return job;
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export function createSearchIndexQueue(useRedis: boolean, redisUrl: string): SearchIndexQueuePort {
  return useRedis ? new BullMqSearchIndexQueue(redisUrl) : new InMemorySearchIndexQueue();
}
