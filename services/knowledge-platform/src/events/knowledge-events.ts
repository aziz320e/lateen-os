export const KNOWLEDGE_EVENT_NAMES = {
  DOCUMENT_IMPORTED: 'knowledge.document.imported',
  EXTRACTION_COMPLETED: 'knowledge.extraction.completed',
  KNOWLEDGE_LINKED: 'knowledge.linked',
  KNOWLEDGE_INDEXED: 'knowledge.indexed',
  KNOWLEDGE_UPDATED: 'knowledge.updated',
  KNOWLEDGE_DELETED: 'knowledge.deleted',
} as const;

export type KnowledgeEventName = (typeof KNOWLEDGE_EVENT_NAMES)[keyof typeof KNOWLEDGE_EVENT_NAMES];

export interface KnowledgeDomainEvent {
  readonly name: KnowledgeEventName;
  readonly timestamp: string;
  readonly organizationId: string;
  readonly correlationId: string;
}

export interface DocumentImportedEvent extends KnowledgeDomainEvent {
  readonly name: typeof KNOWLEDGE_EVENT_NAMES.DOCUMENT_IMPORTED;
  readonly jobId: string;
  readonly sourceType: string;
  readonly title: string;
}

export interface ExtractionCompletedEvent extends KnowledgeDomainEvent {
  readonly name: typeof KNOWLEDGE_EVENT_NAMES.EXTRACTION_COMPLETED;
  readonly jobId: string;
  readonly wordCount: number;
  readonly language: string;
}

export interface KnowledgeLinkedEvent extends KnowledgeDomainEvent {
  readonly name: typeof KNOWLEDGE_EVENT_NAMES.KNOWLEDGE_LINKED;
  readonly knowledgeId: string;
  readonly businessDnaLinks: number;
  readonly domainGraphLinks: number;
  readonly memoryLinks: number;
}

export interface KnowledgeIndexedEvent extends KnowledgeDomainEvent {
  readonly name: typeof KNOWLEDGE_EVENT_NAMES.KNOWLEDGE_INDEXED;
  readonly knowledgeId: string;
  readonly chunkCount: number;
  readonly collection: string;
}

export interface KnowledgeUpdatedEvent extends KnowledgeDomainEvent {
  readonly name: typeof KNOWLEDGE_EVENT_NAMES.KNOWLEDGE_UPDATED;
  readonly knowledgeId: string;
  readonly version: number;
}

export interface KnowledgeDeletedEvent extends KnowledgeDomainEvent {
  readonly name: typeof KNOWLEDGE_EVENT_NAMES.KNOWLEDGE_DELETED;
  readonly knowledgeId: string;
}

export type KnowledgeEvent =
  | DocumentImportedEvent
  | ExtractionCompletedEvent
  | KnowledgeLinkedEvent
  | KnowledgeIndexedEvent
  | KnowledgeUpdatedEvent
  | KnowledgeDeletedEvent;

export interface KnowledgeEventPublisher {
  publish(event: KnowledgeEvent): Promise<void>;
}
