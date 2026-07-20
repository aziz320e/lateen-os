export interface NormalizationResult {
  readonly text: string;
  readonly removedElements: readonly string[];
  readonly normalizedLength: number;
}

/** Text normalization port. */
export interface TextNormalizer {
  normalize(text: string): Promise<NormalizationResult>;
  detectEncoding(text: string): string;
}

export interface LanguageDetectionResult {
  readonly language: string;
  readonly confidence: number;
  readonly alternatives: readonly { readonly language: string; readonly confidence: number }[];
}

/** Language detection port. */
export interface LanguageDetector {
  detect(text: string): Promise<LanguageDetectionResult>;
}

export interface EntityExtractionResult {
  readonly entities: readonly {
    readonly type: string;
    readonly value: string;
    readonly confidence: number;
    readonly startOffset?: number;
    readonly endOffset?: number;
  }[];
}

/** Entity extraction port (contract — no LLM). */
export interface EntityExtractor {
  extract(text: string, language: string): Promise<EntityExtractionResult>;
}

export interface ClassificationResult {
  readonly knowledgeType: string;
  readonly classification: string;
  readonly securityLevel: string;
  readonly confidence: number;
}

/** Document classification port. */
export interface KnowledgeClassifier {
  classify(text: string, metadata: Record<string, unknown>): Promise<ClassificationResult>;
}
