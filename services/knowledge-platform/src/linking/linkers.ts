export interface BusinessDnaLinkRequest {
  readonly organizationId: string;
  readonly entities: readonly { readonly type: string; readonly value: string }[];
  readonly knowledgeId: string;
}

export interface BusinessDnaLinkResult {
  readonly linkedEntityIds: readonly string[];
  readonly skipped: readonly string[];
}

/** Business DNA linking port — orchestrates, does not modify Business DNA. */
export interface BusinessDnaLinker {
  link(request: BusinessDnaLinkRequest): Promise<BusinessDnaLinkResult>;
}

export interface DomainGraphLinkRequest {
  readonly organizationId: string;
  readonly entities: readonly { readonly type: string; readonly value: string }[];
  readonly knowledgeId: string;
}

export interface DomainGraphLinkResult {
  readonly linkedNodeIds: readonly string[];
  readonly linkedEdgeIds: readonly string[];
}

/** Domain Graph linking port — orchestrates, does not modify Domain Graph. */
export interface DomainGraphLinker {
  link(request: DomainGraphLinkRequest): Promise<DomainGraphLinkResult>;
}

export interface InstitutionalMemoryLinkRequest {
  readonly organizationId: string;
  readonly knowledgeId: string;
  readonly knowledgeType: string;
  readonly title: string;
  readonly summary: string;
}

export interface InstitutionalMemoryLinkResult {
  readonly entryIds: readonly string[];
  readonly documentReferenceIds: readonly string[];
}

/** Institutional Memory linking port — orchestrates, does not modify Institutional Memory. */
export interface InstitutionalMemoryLinker {
  link(request: InstitutionalMemoryLinkRequest): Promise<InstitutionalMemoryLinkResult>;
}
