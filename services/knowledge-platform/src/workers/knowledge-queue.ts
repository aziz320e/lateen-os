import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';

export interface KnowledgeQueueJob {
  readonly id: string;
  readonly knowledgeJobId: string;
  readonly queuedAt: string;
}

export interface KnowledgeQueuePort {
  enqueue(knowledgeJobId: string): Promise<KnowledgeQueueJob>;
  close?(): Promise<void>;
}

export class InMemoryKnowledgeQueue implements KnowledgeQueuePort {
  async enqueue(knowledgeJobId: string): Promise<KnowledgeQueueJob> {
    return { id: randomUUID(), knowledgeJobId, queuedAt: new Date().toISOString() };
  }
}

export class BullMqKnowledgeQueue implements KnowledgeQueuePort {
  private readonly queue: Queue;
  private readonly memory = new InMemoryKnowledgeQueue();

  constructor(redisUrl: string) {
    this.queue = new Queue('knowledge-pipeline-jobs', { connection: { url: redisUrl } });
  }

  async enqueue(knowledgeJobId: string): Promise<KnowledgeQueueJob> {
    const job = await this.memory.enqueue(knowledgeJobId);
    await this.queue.add('pipeline', { knowledgeJobId }, { jobId: job.id });
    return job;
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export function createKnowledgeQueue(useRedis: boolean, redisUrl: string): KnowledgeQueuePort {
  return useRedis ? new BullMqKnowledgeQueue(redisUrl) : new InMemoryKnowledgeQueue();
}
