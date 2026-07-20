import { randomUUID } from 'node:crypto';
import type {
  ImportRequest,
  KnowledgeDocument,
  KnowledgeJob,
  KnowledgeStatusSummary,
  PipelineStepResult,
} from '../domain/types.js';
import { KNOWLEDGE_TYPES, PIPELINE_STEP_IDS, PIPELINE_STEPS } from '../domain/types.js';
import type { KnowledgeRepositoryPort } from './knowledge-repository.js';

export class InMemoryKnowledgeRepository implements KnowledgeRepositoryPort {
  private readonly jobs = new Map<string, KnowledgeJob>();
  private readonly documents = new Map<string, KnowledgeDocument>();

  async createJob(request: ImportRequest): Promise<KnowledgeJob> {
    const now = new Date().toISOString();
    const steps: PipelineStepResult[] = PIPELINE_STEPS.map((s) => ({
      stepId: s.id,
      status: 'pending',
      message: 'Pending',
    }));
    const job: KnowledgeJob = {
      id: randomUUID(),
      organizationId: request.organizationId,
      title: request.title,
      knowledgeType: request.knowledgeType,
      sourceType: request.sourceType,
      sourceUri: request.sourceUri,
      mimeType: request.mimeType,
      language: request.metadata?.language,
      classification: request.metadata?.classification ?? 'internal',
      securityLevel: request.metadata?.securityLevel ?? 'standard',
      tags: request.tags ?? request.metadata?.tags ?? [],
      department: request.metadata?.department,
      owner: request.metadata?.owner,
      author: request.metadata?.author,
      status: 'pending',
      steps,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  async findJobById(id: string): Promise<KnowledgeJob | null> {
    return this.jobs.get(id) ?? null;
  }

  async updateJob(job: KnowledgeJob): Promise<KnowledgeJob> {
    this.jobs.set(job.id, { ...job, updatedAt: new Date().toISOString() });
    return this.jobs.get(job.id)!;
  }

  async getStatusSummary(): Promise<KnowledgeStatusSummary> {
    const jobs = [...this.jobs.values()];
    const docs = [...this.documents.values()];
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      running: jobs.filter((j) => j.status === 'running').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      indexed: docs.filter((d) => d.indexed).length,
    };
  }

  async publishDocument(job: KnowledgeJob, links?: KnowledgeDocument['links']): Promise<KnowledgeDocument> {
    const now = new Date().toISOString();
    const doc: KnowledgeDocument = {
      id: job.knowledgeId ?? randomUUID(),
      organizationId: job.organizationId,
      jobId: job.id,
      title: job.title,
      knowledgeType: job.knowledgeType,
      sourceType: job.sourceType,
      language: job.language,
      classification: job.classification,
      securityLevel: job.securityLevel,
      tags: job.tags,
      department: job.department,
      owner: job.owner,
      author: job.author,
      version: 1,
      chunkCount: 1,
      indexed: true,
      links,
      createdAt: now,
      updatedAt: now,
    };
    this.documents.set(doc.id, doc);
    return doc;
  }

  async findDocument(id: string, organizationId: string): Promise<KnowledgeDocument | null> {
    const doc = this.documents.get(id);
    if (!doc || doc.organizationId !== organizationId) return null;
    return doc;
  }

  async listDocuments(organizationId: string): Promise<readonly KnowledgeDocument[]> {
    return [...this.documents.values()].filter((d) => d.organizationId === organizationId);
  }
}

export { KNOWLEDGE_TYPES, PIPELINE_STEP_IDS };
