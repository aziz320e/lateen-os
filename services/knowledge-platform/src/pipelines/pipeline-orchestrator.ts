import { randomUUID } from 'node:crypto';
import type { PipelineStepId } from '../domain/types.js';
import type { ImportRequest } from '../domain/types.js';

export interface PipelineContext {
  readonly jobId: string;
  readonly organizationId: string;
  readonly request: ImportRequest;
  readonly knowledgeId: string;
  readonly extractedText: string;
  readonly language: string;
  readonly chunks: readonly { readonly id: string; readonly text: string }[];
  readonly links: {
    readonly businessDna: readonly string[];
    readonly domainGraph: readonly string[];
    readonly institutionalMemory: readonly string[];
  };
}

export interface PipelineOrchestratorPort {
  execute(stepId: PipelineStepId, ctx: PipelineContext): Promise<Record<string, unknown>>;
}

export class StubPipelineOrchestrator implements PipelineOrchestratorPort {
  private readonly sampleText =
    'Enterprise knowledge document. Contains policies, procedures, and operational guidelines.';

  async execute(stepId: PipelineStepId, ctx: PipelineContext): Promise<Record<string, unknown>> {
    switch (stepId) {
      case 'import':
        return {
          sourceUri: ctx.request.sourceUri ?? `internal://${ctx.organizationId}/${ctx.jobId}`,
          imported: true,
        };
      case 'validate':
        return { valid: true, sourceType: ctx.request.sourceType };
      case 'extract-text':
        return {
          text: this.sampleText,
          method: 'tika',
          wordCount: this.sampleText.split(/\s+/).length,
          metadata: { 'Content-Type': ctx.request.mimeType ?? 'text/plain' },
        };
      case 'ocr':
        return { skipped: true, reason: 'Text extraction sufficient — OCR contract stub' };
      case 'normalize':
        return { text: this.sampleText.trim(), normalizedLength: this.sampleText.length };
      case 'language-detection':
        return { language: ctx.request.metadata?.language ?? 'en', confidence: 0.95 };
      case 'metadata-extraction':
        return {
          title: ctx.request.title,
          author: ctx.request.metadata?.author,
          department: ctx.request.metadata?.department,
          tags: ctx.request.tags ?? [],
        };
      case 'entity-extraction':
        return {
          entities: [
            { type: 'organization', value: ctx.request.organizationId, confidence: 1.0 },
            { type: 'topic', value: ctx.request.knowledgeType, confidence: 0.9 },
          ],
        };
      case 'business-dna-linking':
        return {
          linkedEntityIds: [`org:${ctx.organizationId}`],
          service: 'business-dna-service',
          stub: true,
        };
      case 'domain-graph-linking':
        return {
          linkedNodeIds: [`node:${ctx.knowledgeId}`],
          linkedEdgeIds: [],
          service: 'domain-graph',
          stub: true,
        };
      case 'institutional-memory-linking':
        return {
          entryIds: [`mem:${randomUUID()}`],
          documentReferenceIds: [`docref:${ctx.knowledgeId}`],
          service: 'institutional-memory',
          stub: true,
        };
      case 'chunking':
        return {
          chunks: [
            { id: randomUUID(), index: 0, text: this.sampleText, tokenEstimate: 20 },
          ],
          totalTokens: 20,
          strategy: 'paragraph',
        };
      case 'embedding-request':
        return {
          requestId: randomUUID(),
          modelId: 'text-embedding-3-large',
          providerHub: 'ai-provider-hub',
          chunkEmbeddings: [{ chunkId: ctx.chunks[0]?.id ?? randomUUID(), dimensions: 1536, tokenCount: 20 }],
          totalTokens: 20,
          stub: true,
        };
      case 'vector-index-request':
        return {
          indexed: ctx.chunks.length || 1,
          collection: `knowledge_${ctx.organizationId}`,
          qdrantUrl: 'http://localhost:6333',
          stub: true,
        };
      case 'knowledge-published':
        return {
          knowledgeId: ctx.knowledgeId,
          published: true,
          indexed: true,
          chunkCount: ctx.chunks.length || 1,
        };
      default:
        return {};
    }
  }
}

export function createPipelineContext(jobId: string, request: ImportRequest): PipelineContext {
  return {
    jobId,
    organizationId: request.organizationId,
    request,
    knowledgeId: randomUUID(),
    extractedText: '',
    language: 'en',
    chunks: [],
    links: { businessDna: [], domainGraph: [], institutionalMemory: [] },
  };
}
