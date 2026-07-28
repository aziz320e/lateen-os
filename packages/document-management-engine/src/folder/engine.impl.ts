/**
 * Real Folders engine — hierarchical containers with per-principal
 * permissions and ownership, guarded by a simple active/archived
 * lifecycle (the same 2-state pattern used across the monorepo for
 * simple named containers, e.g. HR Engine's Department, Project
 * Management Engine's Portfolio).
 *
 * @module folder/engine.impl
 */
import { FolderNotFoundError, InvalidFolderTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { FolderId, OrganizationId } from '../shared/identifiers.js';
import type { FolderRepository } from './repository.js';
import type { Folder, FolderAccessLevel, FolderStatus } from './types.js';

const FOLDER_TRANSITIONS: Readonly<Record<FolderStatus, readonly FolderStatus[]>> = {
  active: ['archived'],
  archived: ['active'],
};

/** Whether a folder may transition from one status to another. */
export function canTransitionFolder(from: FolderStatus, to: FolderStatus): boolean {
  return FOLDER_TRANSITIONS[from].includes(to);
}

export interface CreateFolderInput {
  readonly name: string;
  readonly parentFolderId?: FolderId;
  readonly ownerId?: string;
}

export interface UpdateFolderInput {
  readonly name?: string;
  readonly ownerId?: string;
}

export interface GrantFolderPermissionInput {
  readonly principalId: string;
  readonly accessLevel: FolderAccessLevel;
}

export interface FolderManagementEngine {
  create(organizationId: OrganizationId, input: CreateFolderInput): Promise<Folder>;
  update(organizationId: OrganizationId, folderId: FolderId, input: UpdateFolderInput): Promise<Folder>;
  archive(organizationId: OrganizationId, folderId: FolderId): Promise<Folder>;
  restore(organizationId: OrganizationId, folderId: FolderId): Promise<Folder>;
  grantPermission(organizationId: OrganizationId, folderId: FolderId, input: GrantFolderPermissionInput): Promise<Folder>;
  revokePermission(organizationId: OrganizationId, folderId: FolderId, principalId: string): Promise<Folder>;
  get(organizationId: OrganizationId, folderId: FolderId): Promise<Folder | null>;
  list(organizationId: OrganizationId): Promise<readonly Folder[]>;
  getChildren(organizationId: OrganizationId, folderId: FolderId): Promise<readonly Folder[]>;
  getDescendants(organizationId: OrganizationId, folderId: FolderId): Promise<readonly Folder[]>;
  getAncestors(organizationId: OrganizationId, folderId: FolderId): Promise<readonly Folder[]>;
}

/** Creates a real {@link FolderManagementEngine}. */
export function createFolderManagementEngine(repository: FolderRepository, now: () => string = nowIso): FolderManagementEngine {
  async function requireFolder(organizationId: OrganizationId, folderId: FolderId): Promise<Folder> {
    const folder = await repository.findById(organizationId, folderId);
    if (!folder) throw new FolderNotFoundError(folderId);
    return folder;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const folder: Folder = {
        id: generateId('folder'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        parentFolderId: input.parentFolderId,
        ownerId: input.ownerId,
        permissions: [],
        status: 'active',
      };
      await repository.save(folder);
      return folder;
    },

    async update(organizationId, folderId, input) {
      const folder = await requireFolder(organizationId, folderId);
      const updated: Folder = { ...folder, name: input.name ?? folder.name, ownerId: input.ownerId ?? folder.ownerId, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async archive(organizationId, folderId) {
      const folder = await requireFolder(organizationId, folderId);
      if (!canTransitionFolder(folder.status, 'archived')) {
        throw new InvalidFolderTransitionError(folderId, folder.status, 'archived');
      }
      const updated: Folder = { ...folder, status: 'archived', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async restore(organizationId, folderId) {
      const folder = await requireFolder(organizationId, folderId);
      if (!canTransitionFolder(folder.status, 'active')) {
        throw new InvalidFolderTransitionError(folderId, folder.status, 'active');
      }
      const updated: Folder = { ...folder, status: 'active', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async grantPermission(organizationId, folderId, input) {
      const folder = await requireFolder(organizationId, folderId);
      const withoutExisting = folder.permissions.filter((permission) => permission.principalId !== input.principalId);
      const updated: Folder = {
        ...folder,
        permissions: [...withoutExisting, { principalId: input.principalId, accessLevel: input.accessLevel }],
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async revokePermission(organizationId, folderId, principalId) {
      const folder = await requireFolder(organizationId, folderId);
      const updated: Folder = { ...folder, permissions: folder.permissions.filter((permission) => permission.principalId !== principalId), updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, folderId) {
      return repository.findById(organizationId, folderId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async getChildren(organizationId, folderId) {
      return repository.findByParent(organizationId, folderId);
    },

    async getDescendants(organizationId, folderId) {
      const descendants: Folder[] = [];
      const queue = [...(await repository.findByParent(organizationId, folderId))];
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) continue;
        descendants.push(next);
        queue.push(...(await repository.findByParent(organizationId, next.id)));
      }
      return descendants;
    },

    async getAncestors(organizationId, folderId) {
      const ancestors: Folder[] = [];
      let current = await requireFolder(organizationId, folderId);
      while (current.parentFolderId) {
        const parent = await requireFolder(organizationId, current.parentFolderId);
        ancestors.unshift(parent);
        current = parent;
      }
      return ancestors;
    },
  };
}
