import { randomUUID } from 'node:crypto';
import { Queue } from 'bullmq';
import type { MissionQueuePort } from '../domain/ports';
import type { QueuePriority } from '../domain/types';

export class InMemoryMissionQueue implements MissionQueuePort {
  private jobs = new Map<string, { missionId: string; status: string; attempts: number; organizationId: string }>();

  enqueue(input: { missionId: string; organizationId: string; priority: QueuePriority; delayMs?: number }): Promise<{ jobId: string }> {
    const jobId = randomUUID();
    this.jobs.set(jobId, { missionId: input.missionId, status: 'queued', attempts: 0, organizationId: input.organizationId });
    return Promise.resolve({ jobId });
  }

  retry(missionId: string): Promise<{ jobId: string } | null> {
    const existing = [...this.jobs.entries()].find(([, j]) => j.missionId === missionId);
    if (!existing) return Promise.resolve(null);
    const [jobId, job] = existing;
    this.jobs.set(jobId, { ...job, attempts: job.attempts + 1, status: 'queued' });
    return Promise.resolve({ jobId });
  }

  listQueued(organizationId: string): Promise<{ missionId: string; status: string; attempts: number }[]> {
    return Promise.resolve(
      [...this.jobs.values()]
        .filter((j) => j.organizationId === organizationId)
        .map(({ missionId, status, attempts }) => ({ missionId, status, attempts })),
    );
  }
}

export class BullMqMissionQueue implements MissionQueuePort {
  private readonly queue: Queue;
  private readonly memory = new InMemoryMissionQueue();

  constructor(redisUrl: string, queueName = 'mission-scheduler') {
    this.queue = new Queue(queueName, { connection: { url: redisUrl } });
  }

  async enqueue(input: { missionId: string; organizationId: string; priority: QueuePriority; delayMs?: number }) {
    const { jobId } = await this.memory.enqueue(input);
    const priorityMap = { LOW: 10, NORMAL: 5, HIGH: 2, CRITICAL: 1 };
    await this.queue.add(
      'execute-mission',
      { missionId: input.missionId, organizationId: input.organizationId },
      { jobId, delay: input.delayMs, priority: priorityMap[input.priority] },
    );
    return { jobId };
  }

  retry(missionId: string) {
    return this.memory.retry(missionId);
  }

  listQueued(organizationId: string) {
    return this.memory.listQueued(organizationId);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export function createMissionQueue(useRedis: boolean, redisUrl: string): MissionQueuePort {
  return useRedis ? new BullMqMissionQueue(redisUrl) : new InMemoryMissionQueue();
}
