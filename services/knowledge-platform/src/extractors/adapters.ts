export interface TikaExtractRequest {
  readonly mimeType: string;
  readonly contentBase64: string;
  readonly sourceUri?: string;
}

export interface TikaExtractResult {
  readonly text: string;
  readonly metadata: Record<string, string>;
  readonly pageCount?: number;
  readonly wordCount: number;
}

/** Apache Tika adapter contract — no implementation. */
export interface TikaExtractorAdapter {
  extract(request: TikaExtractRequest): Promise<TikaExtractResult>;
  supportedMimeTypes(): readonly string[];
}

export interface OcrExtractRequest {
  readonly imageBase64: string;
  readonly mimeType: string;
  readonly language?: string;
}

export interface OcrExtractResult {
  readonly text: string;
  readonly confidence: number;
  readonly language?: string;
}

/** OCR adapter contract — no implementation. */
export interface OcrExtractorAdapter {
  extract(request: OcrExtractRequest): Promise<OcrExtractResult>;
  requiresOcr(mimeType: string, extractedText: string): boolean;
}

export interface TextExtractionResult {
  readonly text: string;
  readonly method: 'tika' | 'ocr' | 'plain';
  readonly metadata: Record<string, string>;
  readonly wordCount: number;
}

/** Combined text extraction port. */
export interface TextExtractor {
  extract(mimeType: string, contentBase64: string, sourceUri?: string): Promise<TextExtractionResult>;
}
