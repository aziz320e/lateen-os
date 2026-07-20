import type {
  ImportRequest,
  KnowledgeDocument,
  KnowledgeJob,
  KnowledgeStatusSummary,
  PipelineStepId,
} from '../domain/types.js';
import { PIPELINE_STEP_IDS } from '../domain/types.js';

export interface KnowledgeRepositoryPort {
  createJob(request: ImportRequest): Promise<KnowledgeJob>;
  findJobById(id: string): Promise<KnowledgeJob | null>;
  updateJob(job: KnowledgeJob): Promise<KnowledgeJob>;
  getStatusSummary(): Promise<KnowledgeStatusSummary>;
  publishDocument(job: KnowledgeJob, links?: KnowledgeDocument['links']): Promise<KnowledgeDocument>;
  findDocument(id: string, organizationId: string): Promise<KnowledgeDocument | null>;
  listDocuments(organizationId: string): Promise<readonly KnowledgeDocument[]>;
}

export function updatePipelineStep(
  job: KnowledgeJob,
  stepId: PipelineStepId,
  patch: Partial<KnowledgeJob['steps'][number]>,
): KnowledgeJob {
  const steps = job.steps.map((step) => (step.stepId === stepId ? { ...step, ...patch } : step));
  if (!steps.some((s) => s.stepId === stepId)) {
    steps.push({
      stepId,
      status: patch.status ?? 'pending',
      message: patch.message ?? '',
      ...patch,
    });
  }
  return { ...job, steps, currentStep: stepId, updatedAt: new Date().toISOString() };
}
