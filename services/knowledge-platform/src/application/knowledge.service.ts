import type { ImportRequest, KnowledgeDocument, KnowledgeJob, KnowledgeStatusSummary } from '../domain/types.js';
import { PIPELINE_STEP_IDS } from '../domain/types.js';
import type { KnowledgeRepositoryPort } from '../repositories/knowledge-repository.js';
import { updatePipelineStep } from '../repositories/knowledge-repository.js';
import {
  createPipelineContext,
  type PipelineContext,
  type PipelineOrchestratorPort,
} from '../pipelines/pipeline-orchestrator.js';
import type { KnowledgeQueuePort } from '../workers/knowledge-queue.js';
import type { KnowledgeEventPublisher } from '../events/knowledge-events.js';
import { KNOWLEDGE_EVENT_NAMES } from '../events/knowledge-events.js';
import { NoopKnowledgeEventPublisher } from '../events/noop-publisher.js';

export class KnowledgeService {
  constructor(
    private readonly repo: KnowledgeRepositoryPort,
    private readonly orchestrator: PipelineOrchestratorPort,
    private readonly queue: KnowledgeQueuePort,
    private readonly events: KnowledgeEventPublisher = new NoopKnowledgeEventPublisher(),
  ) {}

  async importKnowledge(request: ImportRequest): Promise<KnowledgeJob> {
    const job = await this.repo.createJob(request);
    await this.queue.enqueue(job.id);
    await this.events.publish({
      name: KNOWLEDGE_EVENT_NAMES.DOCUMENT_IMPORTED,
      timestamp: new Date().toISOString(),
      organizationId: request.organizationId,
      correlationId: job.id,
      jobId: job.id,
      sourceType: request.sourceType,
      title: request.title,
    });
    return this.runPipeline(job.id);
  }

  async getJob(id: string): Promise<KnowledgeJob | null> {
    return this.repo.findJobById(id);
  }

  async getDocument(id: string, organizationId: string): Promise<KnowledgeDocument | null> {
    return this.repo.findDocument(id, organizationId);
  }

  async getStatus(): Promise<KnowledgeStatusSummary> {
    return this.repo.getStatusSummary();
  }

  async runPipeline(jobId: string): Promise<KnowledgeJob> {
    let job = await this.repo.findJobById(jobId);
    if (!job) throw new Error(`Knowledge job not found: ${jobId}`);

    job = await this.repo.updateJob({ ...job, status: 'running' });
    const ctx = createPipelineContext(jobId, {
      organizationId: job.organizationId,
      title: job.title,
      knowledgeType: job.knowledgeType,
      sourceType: job.sourceType,
      sourceUri: job.sourceUri,
      mimeType: job.mimeType,
      tags: job.tags,
      metadata: {
        title: job.title,
        classification: job.classification,
        securityLevel: job.securityLevel,
        department: job.department,
        owner: job.owner,
        author: job.author,
        tags: job.tags,
        version: 1,
        source: job.sourceType,
      },
    });

    let extractedText = '';
    let language = 'en';
    let chunks: PipelineContext['chunks'] = [];
    const links = {
      businessDna: [] as string[],
      domainGraph: [] as string[],
      institutionalMemory: [] as string[],
    };

    for (const stepId of PIPELINE_STEP_IDS) {
      job = updatePipelineStep(job, stepId, {
        status: 'running',
        startedAt: new Date().toISOString(),
        message: 'Running',
      });
      job = await this.repo.updateJob(job);

      try {
        const output = await this.orchestrator.execute(stepId, {
          ...ctx,
          extractedText,
          language,
          chunks,
          links,
        });
        const skipped = output.skipped === true;

        if (stepId === 'extract-text' && typeof output.text === 'string') extractedText = output.text;
        if (stepId === 'language-detection' && typeof output.language === 'string') language = output.language;
        if (stepId === 'chunking' && Array.isArray(output.chunks)) {
          chunks = output.chunks as PipelineContext['chunks'];
        }
        if (stepId === 'business-dna-linking' && Array.isArray(output.linkedEntityIds)) {
          links.businessDna.push(...(output.linkedEntityIds as string[]));
        }
        if (stepId === 'domain-graph-linking' && Array.isArray(output.linkedNodeIds)) {
          links.domainGraph.push(...(output.linkedNodeIds as string[]));
        }
        if (stepId === 'institutional-memory-linking' && Array.isArray(output.entryIds)) {
          links.institutionalMemory.push(...(output.entryIds as string[]));
        }

        if (stepId === 'extract-text') {
          await this.events.publish({
            name: KNOWLEDGE_EVENT_NAMES.EXTRACTION_COMPLETED,
            timestamp: new Date().toISOString(),
            organizationId: job.organizationId,
            correlationId: job.id,
            jobId: job.id,
            wordCount: Number(output.wordCount ?? 0),
            language,
          });
        }

        job = updatePipelineStep(job, stepId, {
          status: skipped ? 'skipped' : 'completed',
          message: skipped ? String(output.reason ?? 'Skipped') : 'Completed',
          output,
          completedAt: new Date().toISOString(),
        });
        job = await this.repo.updateJob(job);
      } catch (error) {
        job = updatePipelineStep(job, stepId, {
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
          completedAt: new Date().toISOString(),
        });
        job = await this.repo.updateJob({ ...job, status: 'failed' });
        return job;
      }
    }

    const knowledgeId = ctx.knowledgeId;
    job = await this.repo.updateJob({ ...job, knowledgeId, status: 'completed', completedAt: new Date().toISOString() });

    const doc = await this.repo.publishDocument(job, {
      businessDnaEntityIds: links.businessDna,
      domainGraphNodeIds: links.domainGraph,
      institutionalMemoryEntryIds: links.institutionalMemory,
    });

    await this.events.publish({
      name: KNOWLEDGE_EVENT_NAMES.KNOWLEDGE_LINKED,
      timestamp: new Date().toISOString(),
      organizationId: job.organizationId,
      correlationId: job.id,
      knowledgeId: doc.id,
      businessDnaLinks: links.businessDna.length,
      domainGraphLinks: links.domainGraph.length,
      memoryLinks: links.institutionalMemory.length,
    });

    await this.events.publish({
      name: KNOWLEDGE_EVENT_NAMES.KNOWLEDGE_INDEXED,
      timestamp: new Date().toISOString(),
      organizationId: job.organizationId,
      correlationId: job.id,
      knowledgeId: doc.id,
      chunkCount: doc.chunkCount,
      collection: `knowledge_${job.organizationId}`,
    });

    return job;
  }
}
