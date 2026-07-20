import { randomUUID } from 'node:crypto';
import type { SearchHit, SearchRequest, SearchSource } from '../domain/types.js';
import type { SourceSearchAdapter } from './source-adapter.js';

function stubHit(source: SearchSource, request: SearchRequest, title: string, entityType: string, score: number): SearchHit {
  return {
    id: randomUUID(),
    source,
    title,
    description: `Result for "${request.query}" from ${source}`,
    entityType,
    score,
    highlights: [{ field: 'title', snippet: `<em>${request.query}</em> in ${title}` }],
    metadata: { organizationId: request.filters.organizationId, stub: true },
    createdAt: new Date().toISOString(),
  };
}

export class StubSourceAdapter implements SourceSearchAdapter {
  constructor(
    readonly source: SearchSource,
    private readonly entityType: string,
    private readonly titlePrefix: string,
    private readonly baseScore: number,
  ) {}

  isAvailable(): boolean {
    return true;
  }

  async search(request: SearchRequest): Promise<readonly SearchHit[]> {
    if (!request.query.trim()) return [];
    const q = request.query.toLowerCase();
    const title = `${this.titlePrefix}: ${request.query}`;
    if (!title.toLowerCase().includes(q) && !this.titlePrefix.toLowerCase().includes(q)) {
      return [stubHit(this.source, request, title, this.entityType, this.baseScore * 0.5)];
    }
    return [stubHit(this.source, request, title, this.entityType, this.baseScore)];
  }
}

export function createDefaultSourceAdapters(): SourceSearchAdapter[] {
  return [
    new StubSourceAdapter('business-dna', 'organization', 'Business DNA Entity', 0.95),
    new StubSourceAdapter('institutional-memory', 'knowledge-entry', 'Memory Entry', 0.9),
    new StubSourceAdapter('knowledge-platform', 'document', 'Knowledge Document', 0.92),
    new StubSourceAdapter('marketplace', 'extension', 'Marketplace Extension', 0.85),
    new StubSourceAdapter('projects', 'project', 'Project', 0.88),
    new StubSourceAdapter('customers', 'customer', 'Customer', 0.87),
    new StubSourceAdapter('products', 'product', 'Product', 0.86),
    new StubSourceAdapter('orders', 'order', 'Order', 0.8),
    new StubSourceAdapter('invoices', 'invoice', 'Invoice', 0.78),
    new StubSourceAdapter('workflows', 'workflow', 'Workflow', 0.84),
    new StubSourceAdapter('missions', 'mission', 'Mission', 0.83),
    new StubSourceAdapter('ai-conversations', 'conversation', 'AI Conversation', 0.75),
    new StubSourceAdapter('extensions', 'extension', 'Extension', 0.82),
    new StubSourceAdapter('connectors', 'connector', 'Connector', 0.81),
    new StubSourceAdapter('reports', 'report', 'Report', 0.79),
    new StubSourceAdapter('files', 'file', 'File', 0.77),
    new StubSourceAdapter('emails', 'email', 'Email', 0.76),
    new StubSourceAdapter('documents', 'document', 'Document', 0.91),
  ];
}
