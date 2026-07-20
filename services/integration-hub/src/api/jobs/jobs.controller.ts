import { Controller, Get, Inject, NotFoundException, Param, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { APP_CONFIG, JOB_SERVICE } from '../tokens';
import { resolveOrganizationId } from '../org-context';
import type { AppConfig } from '../../config/index';
import type { JobService } from '../../jobs/job.service';

@Controller('api/jobs')
export class JobsController {
  constructor(
    @Inject(JOB_SERVICE) private readonly jobs: JobService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get()
  listJobs(@Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.jobs.listJobs(organizationId);
  }

  @Post(':id/retry')
  async retry(@Param('id') id: string, @Req() req: FastifyRequest) {
    resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    const job = await this.jobs.retryJob(id);
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }
}
