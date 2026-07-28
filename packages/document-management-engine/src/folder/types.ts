/** @module folder/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { FolderId } from '../shared/identifiers.js';

export type { FolderId };

export type FolderStatus = 'active' | 'archived';

export type FolderAccessLevel = 'read' | 'write' | 'admin';

export interface FolderPermission {
  /** Opaque foreign key — typically an HR employee id or a team/group id. */
  readonly principalId: string;
  readonly accessLevel: FolderAccessLevel;
}

/** A hierarchical container for documents, with per-principal permissions and an owner. */
export interface Folder extends TenantAuditableEntity<FolderId> {
  readonly name: string;
  readonly parentFolderId?: FolderId;
  /** Opaque foreign key — typically an HR employee id. */
  readonly ownerId?: string;
  readonly permissions: readonly FolderPermission[];
  readonly status: FolderStatus;
}
