/** Typed errors used consistently across the Document Management Engine runtime implementations. @module shared/errors */

export class DocumentNotFoundError extends Error {
  constructor(readonly documentId: string) {
    super(`Document "${documentId}" not found`);
    this.name = 'DocumentNotFoundError';
  }
}

export class InvalidDocumentTransitionError extends Error {
  constructor(
    readonly documentId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Document "${documentId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidDocumentTransitionError';
  }
}

export class FolderNotFoundError extends Error {
  constructor(readonly folderId: string) {
    super(`Folder "${folderId}" not found`);
    this.name = 'FolderNotFoundError';
  }
}

export class InvalidFolderTransitionError extends Error {
  constructor(
    readonly folderId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Folder "${folderId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidFolderTransitionError';
  }
}

export class DocumentVersionNotFoundError extends Error {
  constructor(readonly versionId: string) {
    super(`Document version "${versionId}" not found`);
    this.name = 'DocumentVersionNotFoundError';
  }
}

export class DocumentRelationshipNotFoundError extends Error {
  constructor(readonly relationshipId: string) {
    super(`Document relationship "${relationshipId}" not found`);
    this.name = 'DocumentRelationshipNotFoundError';
  }
}
