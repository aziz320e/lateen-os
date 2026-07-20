import { randomUUID } from 'node:crypto';
import type {
  ProvisioningJob,
  ProvisioningRequest,
  ProvisioningStatusSummary,
  ProvisioningStepId,
  ProvisioningStepResult,
  StepStatus,
} from '../domain/types.js';
import { PROVISIONING_STEP_IDS } from '../domain/types.js';

export interface ProvisioningRepositoryPort {
  create(request: ProvisioningRequest): Promise<ProvisioningJob>;
  findById(id: string): Promise<ProvisioningJob | null>;
  update(job: ProvisioningJob): Promise<ProvisioningJob>;
  list(): Promise<ProvisioningJob[]>;
  getStatusSummary(): Promise<ProvisioningStatusSummary>;
}

function isoNow(): string {
  return new Date().toISOString();
}

function initialSteps(): ProvisioningStepResult[] {
  return PROVISIONING_STEP_IDS.map((stepId) => ({
    stepId,
    status: 'pending' as StepStatus,
    message: 'Pending',
  }));
}

export class InMemoryProvisioningRepository implements ProvisioningRepositoryPort {
  private readonly jobs = new Map<string, ProvisioningJob>();

  async create(request: ProvisioningRequest): Promise<ProvisioningJob> {
    const id = randomUUID();
    const now = isoNow();
    const job: ProvisioningJob = {
      id,
      organizationName: request.organizationName,
      profile: request.profile,
      industry: request.industry,
      country: request.country,
      timezone: request.timezone ?? 'UTC',
      currency: request.currency ?? 'USD',
      language: request.language ?? 'en',
      employeeCount: request.employeeCount ?? 1,
      extensions: request.extensions ?? [],
      aiWorkers: request.aiWorkers ?? [],
      status: 'pending',
      steps: initialSteps(),
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(id, job);
    return job;
  }

  async findById(id: string): Promise<ProvisioningJob | null> {
    return this.jobs.get(id) ?? null;
  }

  async update(job: ProvisioningJob): Promise<ProvisioningJob> {
    const updated = { ...job, updatedAt: isoNow() };
    this.jobs.set(job.id, updated);
    return updated;
  }

  async list(): Promise<ProvisioningJob[]> {
    return [...this.jobs.values()];
  }

  async getStatusSummary(): Promise<ProvisioningStatusSummary> {
    const jobs = [...this.jobs.values()];
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      running: jobs.filter((j) => j.status === 'running').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
    };
  }
}

export function updateStep(
  job: ProvisioningJob,
  stepId: ProvisioningStepId,
  patch: Partial<ProvisioningStepResult>,
): ProvisioningJob {
  const steps = job.steps.map((s) => (s.stepId === stepId ? { ...s, ...patch } : s));
  return { ...job, steps, currentStep: stepId };
}
