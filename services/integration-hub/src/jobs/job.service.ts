import type { JobQueuePort } from '../domain/ports';

export class JobService {
  constructor(private readonly jobs: JobQueuePort) {}

  listJobs(organizationId: string) {
    return this.jobs.listJobs(organizationId);
  }

  retryJob(jobId: string) {
    return this.jobs.retry(jobId);
  }
}
