import { createHash, randomUUID } from 'node:crypto';
import type { ImportRequest, SourceType } from '../domain/types.js';
import { SUPPORTED_SOURCE_TYPES } from '../domain/types.js';
import type { ImportResult, KnowledgeImporter, ValidationResult } from './importer.js';

export class StubKnowledgeImporter implements KnowledgeImporter {
  supportsSource(sourceType: SourceType): boolean {
    return SUPPORTED_SOURCE_TYPES.includes(sourceType);
  }

  async importDocument(request: ImportRequest): Promise<ImportResult> {
    const content = request.contentBase64 ?? '';
    const checksum = createHash('sha256').update(content || request.title).digest('hex');
    return {
      sourceUri: request.sourceUri ?? `internal://${request.organizationId}/${randomUUID()}`,
      mimeType: request.mimeType ?? 'application/octet-stream',
      byteSize: content.length,
      checksum,
    };
  }

  async validate(request: ImportRequest): Promise<ValidationResult> {
    const errors: string[] = [];
    if (!request.organizationId) errors.push('organizationId required');
    if (!request.title) errors.push('title required');
    if (!this.supportsSource(request.sourceType)) errors.push(`Unsupported source: ${request.sourceType}`);
    return { valid: errors.length === 0, errors, warnings: [] };
  }
}
