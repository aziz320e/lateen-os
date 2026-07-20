/** Knowledge platform domain contracts — orchestration only, no AI reasoning. */

export type KnowledgeType =
  | 'document'
  | 'email'
  | 'policy'
  | 'procedure'
  | 'manual'
  | 'contract'
  | 'specification'
  | 'research'
  | 'meeting'
  | 'presentation'
  | 'spreadsheet'
  | 'template'
  | 'playbook'
  | 'knowledge-article';

export type SourceType =
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'xlsx'
  | 'xls'
  | 'csv'
  | 'pptx'
  | 'txt'
  | 'markdown'
  | 'html'
  | 'eml'
  | 'google-drive'
  | 'onedrive'
  | 'sharepoint'
  | 'dropbox'
  | 'slack'
  | 'microsoft-teams'
  | 'notion'
  | 'confluence'
  | 'web-page';

export type ClassificationLevel = 'public' | 'internal' | 'confidential' | 'restricted';
export type SecurityLevel = 'standard' | 'elevated' | 'critical';
export type PipelineStatus = 'pending' | 'running' | 'completed' | 'failed';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export const PIPELINE_STEP_IDS = [
  'import',
  'validate',
  'extract-text',
  'ocr',
  'normalize',
  'language-detection',
  'metadata-extraction',
  'entity-extraction',
  'business-dna-linking',
  'domain-graph-linking',
  'institutional-memory-linking',
  'chunking',
  'embedding-request',
  'vector-index-request',
  'knowledge-published',
] as const;

export type PipelineStepId = (typeof PIPELINE_STEP_IDS)[number];

export interface PipelineStepDefinition {
  readonly id: PipelineStepId;
  readonly name: string;
  readonly module: string;
}

export interface KnowledgeMetadata {
  readonly title: string;
  readonly author?: string;
  readonly department?: string;
  readonly owner?: string;
  readonly tags: readonly string[];
  readonly language?: string;
  readonly created?: string;
  readonly modified?: string;
  readonly classification: ClassificationLevel;
  readonly securityLevel: SecurityLevel;
  readonly retention?: string;
  readonly version: number;
  readonly source: SourceType;
}

export interface ImportRequest {
  readonly organizationId: string;
  readonly title: string;
  readonly knowledgeType: KnowledgeType;
  readonly sourceType: SourceType;
  readonly sourceUri?: string;
  readonly mimeType?: string;
  readonly contentBase64?: string;
  readonly metadata?: Partial<KnowledgeMetadata>;
  readonly tags?: readonly string[];
}

export interface PipelineStepResult {
  readonly stepId: PipelineStepId;
  readonly status: StepStatus;
  readonly message: string;
  readonly output?: Record<string, unknown>;
  readonly startedAt?: string;
  readonly completedAt?: string;
}

export interface KnowledgeJob {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly knowledgeType: KnowledgeType;
  readonly sourceType: SourceType;
  readonly sourceUri?: string;
  readonly mimeType?: string;
  readonly language?: string;
  readonly classification: ClassificationLevel;
  readonly securityLevel: SecurityLevel;
  readonly tags: readonly string[];
  readonly department?: string;
  readonly owner?: string;
  readonly author?: string;
  readonly status: PipelineStatus;
  readonly currentStep?: PipelineStepId;
  readonly knowledgeId?: string;
  readonly steps: readonly PipelineStepResult[];
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
}

export interface KnowledgeDocument {
  readonly id: string;
  readonly organizationId: string;
  readonly jobId?: string;
  readonly title: string;
  readonly knowledgeType: KnowledgeType;
  readonly sourceType: SourceType;
  readonly language?: string;
  readonly classification: ClassificationLevel;
  readonly securityLevel: SecurityLevel;
  readonly tags: readonly string[];
  readonly department?: string;
  readonly owner?: string;
  readonly author?: string;
  readonly version: number;
  readonly chunkCount: number;
  readonly indexed: boolean;
  readonly links?: KnowledgeLinks;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface KnowledgeLinks {
  readonly businessDnaEntityIds?: readonly string[];
  readonly domainGraphNodeIds?: readonly string[];
  readonly institutionalMemoryEntryIds?: readonly string[];
}

export interface KnowledgeStatusSummary {
  readonly total: number;
  readonly pending: number;
  readonly running: number;
  readonly completed: number;
  readonly failed: number;
  readonly indexed: number;
}

export const PIPELINE_STEPS: PipelineStepDefinition[] = [
  { id: 'import', name: 'Import', module: 'ingestion' },
  { id: 'validate', name: 'Validate', module: 'ingestion' },
  { id: 'extract-text', name: 'Extract Text', module: 'extractors' },
  { id: 'ocr', name: 'OCR', module: 'extractors' },
  { id: 'normalize', name: 'Normalize', module: 'normalization' },
  { id: 'language-detection', name: 'Language Detection', module: 'classifiers' },
  { id: 'metadata-extraction', name: 'Metadata Extraction', module: 'metadata' },
  { id: 'entity-extraction', name: 'Entity Extraction', module: 'classifiers' },
  { id: 'business-dna-linking', name: 'Business DNA Linking', module: 'linking' },
  { id: 'domain-graph-linking', name: 'Domain Graph Linking', module: 'linking' },
  { id: 'institutional-memory-linking', name: 'Institutional Memory Linking', module: 'linking' },
  { id: 'chunking', name: 'Chunking', module: 'chunking' },
  { id: 'embedding-request', name: 'Embedding Request', module: 'indexing' },
  { id: 'vector-index-request', name: 'Vector Index Request', module: 'indexing' },
  { id: 'knowledge-published', name: 'Knowledge Published', module: 'pipelines' },
];

export const SUPPORTED_SOURCE_TYPES: readonly SourceType[] = [
  'pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv', 'pptx', 'txt', 'markdown', 'html', 'eml',
  'google-drive', 'onedrive', 'sharepoint', 'dropbox', 'slack', 'microsoft-teams', 'notion', 'confluence', 'web-page',
];

export const KNOWLEDGE_TYPES: readonly KnowledgeType[] = [
  'document', 'email', 'policy', 'procedure', 'manual', 'contract', 'specification',
  'research', 'meeting', 'presentation', 'spreadsheet', 'template', 'playbook', 'knowledge-article',
];
