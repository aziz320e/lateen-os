import type {
  ProvisioningJob,
  ProvisioningReport,
  ProvisioningRequest,
  ProvisioningStatusSummary,
  ProvisioningStepId,
} from '../domain/types.js';
import { PROVISIONING_STEP_IDS } from '../domain/types.js';
import type { ProvisioningRepositoryPort } from '../repositories/provisioning-repository.js';
import { updateStep } from '../repositories/provisioning-repository.js';
import {
  createOrchestratorContext,
  type StepOrchestratorPort,
} from '../orchestrator/step-orchestrator.js';
import type { ProvisioningQueuePort } from '../jobs/provisioning-queue.js';

export class ProvisioningService {
  constructor(
    private readonly repo: ProvisioningRepositoryPort,
    private readonly orchestrator: StepOrchestratorPort,
    private readonly queue: ProvisioningQueuePort,
  ) {}

  async startProvisioning(request: ProvisioningRequest): Promise<ProvisioningJob> {
    const job = await this.repo.create(request);
    await this.queue.enqueue(job.id);
    return this.runProvisioning(job.id);
  }

  async getJob(id: string): Promise<ProvisioningJob | null> {
    return this.repo.findById(id);
  }

  async getStatus(): Promise<ProvisioningStatusSummary> {
    return this.repo.getStatusSummary();
  }

  async runProvisioning(jobId: string): Promise<ProvisioningJob> {
    let job = await this.repo.findById(jobId);
    if (!job) throw new Error(`Provisioning job not found: ${jobId}`);

    job = await this.repo.update({ ...job, status: 'running' });
    const ctx = createOrchestratorContext(jobId, {
      organizationName: job.organizationName,
      profile: job.profile,
      industry: job.industry,
      country: job.country,
      timezone: job.timezone,
      currency: job.currency,
      language: job.language,
      employeeCount: job.employeeCount,
      extensions: job.extensions,
      aiWorkers: job.aiWorkers,
    });

    for (const stepId of PROVISIONING_STEP_IDS) {
      job = updateStep(job, stepId, { status: 'running', startedAt: new Date().toISOString(), message: 'Running' });
      job = await this.repo.update(job);

      try {
        const output = await this.orchestrator.execute(stepId, ctx);
        const skipped = output.skipped === true;
        job = updateStep(job, stepId, {
          status: skipped ? 'skipped' : 'completed',
          message: skipped ? String(output.reason ?? 'Skipped') : 'Completed',
          output,
          completedAt: new Date().toISOString(),
        });
        job = await this.repo.update(job);
      } catch (error) {
        job = updateStep(job, stepId, {
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
          completedAt: new Date().toISOString(),
        });
        job = await this.repo.update({ ...job, status: 'failed' });
        return job;
      }
    }

    const report = this.buildReport(job, ctx.organizationId, ctx.tenantId);
    job = await this.repo.update({
      ...job,
      status: 'completed',
      report,
      completedAt: new Date().toISOString(),
    });
    return job;
  }

  private buildReport(job: ProvisioningJob, organizationId: string, tenantId: string): ProvisioningReport {
    const completed = job.steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
    return {
      jobId: job.id,
      organizationId,
      tenantId,
      profile: job.profile,
      stepsCompleted: completed,
      stepsTotal: PROVISIONING_STEP_IDS.length,
      healthStatus: 'healthy',
      summary: `Provisioned ${job.organizationName} with ${job.profile} profile`,
      generatedAt: new Date().toISOString(),
    };
  }
}

export type { ProvisioningStepId };
