import { randomUUID } from 'node:crypto';
import { Queue } from 'bullmq';
import type { HubJob } from '../domain/types';
import type { JobQueuePort } from '../domain/ports';

export class InMemoryJobQueue implements JobQueuePort {
  private jobs = new Map<string, HubJob>();

  enqueue(job: Omit<HubJob, 'id' | 'queuedAt' | 'status' | 'attempts'>): Promise<HubJob> {
    const full: HubJob = {
      ...job,
      id: randomUUID(),
      status: 'queued',
      attempts: 0,
      queuedAt: new Date().toISOString(),
    };
    this.jobs.set(full.id, full);
    return Promise.resolve(full);
  }

  listJobs(organizationId: string): Promise<HubJob[]> {
    return Promise.resolve([...this.jobs.values()].filter((j) => j.organizationId === organizationId));
  }

  retry(jobId: string): Promise<HubJob | null> {
    const job = this.jobs.get(jobId);
    if (!job) return Promise.resolve(null);
    const updated = { ...job, attempts: job.attempts + 1, status: 'queued' };
    this.jobs.set(jobId, updated);
    return Promise.resolve(updated);
  }
}

/** BullMQ-backed queue — enqueues only; workers are out of scope for v1 contracts. */
export class BullMqJobQueue implements JobQueuePort {
  private readonly queue: Queue;
  private readonly memory = new InMemoryJobQueue();

  constructor(redisUrl: string, queueName = 'integration-hub-jobs') {
    this.queue = new Queue(queueName, { connection: { url: redisUrl } });
  }

  async enqueue(job: Omit<HubJob, 'id' | 'queuedAt' | 'status' | 'attempts'>): Promise<HubJob> {
    const hubJob = await this.memory.enqueue(job);
    await this.queue.add(job.type, { organizationId: job.organizationId, connectorId: job.connectorId }, { jobId: hubJob.id });
    return hubJob;
  }

  listJobs(organizationId: string): Promise<HubJob[]> {
    return this.memory.listJobs(organizationId);
  }

  retry(jobId: string): Promise<HubJob | null> {
    return this.memory.retry(jobId);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export function createJobQueue(useRedis: boolean, redisUrl: string): JobQueuePort {
  return useRedis ? new BullMqJobQueue(redisUrl) : new InMemoryJobQueue();
}
