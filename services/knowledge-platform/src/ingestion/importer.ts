import type { ImportRequest, SourceType } from '../domain/types.js';

export interface ImportResult {
  readonly sourceUri: string;
  readonly mimeType: string;
  readonly byteSize: number;
  readonly checksum: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/** Ingestion port — import and validate knowledge sources. */
export interface KnowledgeImporter {
  importDocument(request: ImportRequest): Promise<ImportResult>;
  validate(request: ImportRequest): Promise<ValidationResult>;
  supportsSource(sourceType: SourceType): boolean;
}
