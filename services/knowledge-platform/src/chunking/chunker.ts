export interface KnowledgeChunk {
  readonly id: string;
  readonly index: number;
  readonly text: string;
  readonly tokenEstimate: number;
  readonly metadata: Record<string, unknown>;
}

export interface ChunkingResult {
  readonly chunks: readonly KnowledgeChunk[];
  readonly totalTokens: number;
  readonly strategy: string;
}

export interface ChunkingOptions {
  readonly maxTokens: number;
  readonly overlapTokens: number;
  readonly strategy: 'fixed' | 'semantic' | 'paragraph';
}

/** Text chunking port. */
export interface KnowledgeChunker {
  chunk(text: string, options?: Partial<ChunkingOptions>): Promise<ChunkingResult>;
}
