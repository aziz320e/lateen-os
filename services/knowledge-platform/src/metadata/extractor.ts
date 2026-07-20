export interface MetadataExtractionResult {
  readonly title?: string;
  readonly author?: string;
  readonly department?: string;
  readonly created?: string;
  readonly modified?: string;
  readonly tags: readonly string[];
  readonly custom: Record<string, unknown>;
}

/** Metadata extraction port. */
export interface MetadataExtractor {
  extract(text: string, sourceMetadata: Record<string, string>): Promise<MetadataExtractionResult>;
}
