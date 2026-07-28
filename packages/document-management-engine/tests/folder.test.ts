import { describe, expect, it } from 'vitest';
import { canTransitionFolder, createFolderManagementEngine } from '../src/folder/engine.impl.js';
import { createFolderRepository } from '../src/folder/repository.impl.js';
import { FolderNotFoundError, InvalidFolderTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  return { engine: createFolderManagementEngine(createFolderRepository()) };
}

describe('canTransitionFolder (pure)', () => {
  it('active -> archived, archived -> active', () => {
    expect(canTransitionFolder('active', 'archived')).toBe(true);
    expect(canTransitionFolder('archived', 'active')).toBe(true);
  });
});

describe('FolderManagementEngine — lifecycle', () => {
  it('creates a folder at active status with no permissions', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Contracts' });
    expect(folder.status).toBe('active');
    expect(folder.permissions).toEqual([]);
  });

  it('accepts an optional parentFolderId and ownerId', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { name: 'Legal' });
    const child = await engine.create(ORG, { name: 'Contracts', parentFolderId: parent.id, ownerId: 'employee-1' });
    expect(child.parentFolderId).toBe(parent.id);
    expect(child.ownerId).toBe('employee-1');
  });

  it('update() changes name and owner', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Original' });
    const updated = await engine.update(ORG, folder.id, { name: 'Renamed', ownerId: 'employee-2' });
    expect(updated.name).toBe('Renamed');
    expect(updated.ownerId).toBe('employee-2');
  });

  it('archive() and restore() toggle status', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Contracts' });
    const archived = await engine.archive(ORG, folder.id);
    expect(archived.status).toBe('archived');
    const restored = await engine.restore(ORG, folder.id);
    expect(restored.status).toBe('active');
  });

  it('archive() rejects an already-archived folder', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Contracts' });
    await engine.archive(ORG, folder.id);
    await expect(engine.archive(ORG, folder.id)).rejects.toBeInstanceOf(InvalidFolderTransitionError);
  });

  it('restore() rejects an already-active folder', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Contracts' });
    await expect(engine.restore(ORG, folder.id)).rejects.toBeInstanceOf(InvalidFolderTransitionError);
  });

  it('update()/archive() throw FolderNotFoundError for an unknown folder', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, 'missing', { name: 'x' })).rejects.toBeInstanceOf(FolderNotFoundError);
    await expect(engine.archive(ORG, 'missing')).rejects.toBeInstanceOf(FolderNotFoundError);
  });
});

describe('FolderManagementEngine — permissions', () => {
  it('grantPermission() adds a permission entry', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Contracts' });
    const updated = await engine.grantPermission(ORG, folder.id, { principalId: 'employee-1', accessLevel: 'write' });
    expect(updated.permissions).toEqual([{ principalId: 'employee-1', accessLevel: 'write' }]);
  });

  it('grantPermission() replaces an existing permission for the same principal', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Contracts' });
    await engine.grantPermission(ORG, folder.id, { principalId: 'employee-1', accessLevel: 'read' });
    const updated = await engine.grantPermission(ORG, folder.id, { principalId: 'employee-1', accessLevel: 'admin' });
    expect(updated.permissions).toEqual([{ principalId: 'employee-1', accessLevel: 'admin' }]);
  });

  it('revokePermission() removes a permission entry', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Contracts' });
    await engine.grantPermission(ORG, folder.id, { principalId: 'employee-1', accessLevel: 'write' });
    const updated = await engine.revokePermission(ORG, folder.id, 'employee-1');
    expect(updated.permissions).toEqual([]);
  });

  it('a folder can have multiple independent permissions', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Contracts' });
    await engine.grantPermission(ORG, folder.id, { principalId: 'employee-1', accessLevel: 'read' });
    const updated = await engine.grantPermission(ORG, folder.id, { principalId: 'employee-2', accessLevel: 'write' });
    expect(updated.permissions).toHaveLength(2);
  });
});

describe('FolderManagementEngine — hierarchy', () => {
  it('getChildren() returns direct children only', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { name: 'Legal' });
    const child = await engine.create(ORG, { name: 'Contracts', parentFolderId: parent.id });
    await engine.create(ORG, { name: 'Grandchild', parentFolderId: child.id });
    expect(await engine.getChildren(ORG, parent.id)).toEqual([child]);
  });

  it('getDescendants() returns every descendant at any depth', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { name: 'Legal' });
    const child = await engine.create(ORG, { name: 'Contracts', parentFolderId: parent.id });
    const grandchild = await engine.create(ORG, { name: 'Signed', parentFolderId: child.id });
    const descendants = await engine.getDescendants(ORG, parent.id);
    expect(descendants.map((folder) => folder.id).sort()).toEqual([child.id, grandchild.id].sort());
  });

  it('getAncestors() returns the chain from immediate parent up to the root', async () => {
    const { engine } = setup();
    const root = await engine.create(ORG, { name: 'Root' });
    const middle = await engine.create(ORG, { name: 'Middle', parentFolderId: root.id });
    const leaf = await engine.create(ORG, { name: 'Leaf', parentFolderId: middle.id });
    const ancestors = await engine.getAncestors(ORG, leaf.id);
    expect(ancestors.map((folder) => folder.id)).toEqual([root.id, middle.id]);
  });

  it('getAncestors() returns an empty array for a root folder', async () => {
    const { engine } = setup();
    const root = await engine.create(ORG, { name: 'Root' });
    expect(await engine.getAncestors(ORG, root.id)).toEqual([]);
  });

  it('a folder with no children returns empty getChildren/getDescendants', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Leaf' });
    expect(await engine.getChildren(ORG, folder.id)).toEqual([]);
    expect(await engine.getDescendants(ORG, folder.id)).toEqual([]);
  });
});

describe('FolderManagementEngine — queries and org scoping', () => {
  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const folder = await engine.create(ORG, { name: 'Contracts' });
    expect(await engine.get(ORG, folder.id)).toEqual(folder);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('folders are isolated per organization', async () => {
    const { engine } = setup();
    await engine.create(ORG, { name: 'A' });
    await engine.create('org-2', { name: 'A' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });
});

describe('FolderManagementEngine — not-found guards', () => {
  it('grantPermission()/revokePermission() throw FolderNotFoundError for an unknown folder', async () => {
    const { engine } = setup();
    await expect(engine.grantPermission(ORG, 'missing', { principalId: 'e1', accessLevel: 'read' })).rejects.toBeInstanceOf(FolderNotFoundError);
    await expect(engine.revokePermission(ORG, 'missing', 'e1')).rejects.toBeInstanceOf(FolderNotFoundError);
  });

  it('restore()/getAncestors() throw FolderNotFoundError for an unknown folder', async () => {
    const { engine } = setup();
    await expect(engine.restore(ORG, 'missing')).rejects.toBeInstanceOf(FolderNotFoundError);
    await expect(engine.getAncestors(ORG, 'missing')).rejects.toBeInstanceOf(FolderNotFoundError);
  });
});

describe('FolderManagementEngine — additional coverage', () => {
  it('revokePermission() on a principal with no permission is a safe no-op', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'X' });
    const updated = await engine.revokePermission(ORG, folder.id, 'never-granted');
    expect(updated.permissions).toEqual([]);
  });

  it('grantPermission() supports read, write, and admin access levels', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'X' });
    const readGrant = await engine.grantPermission(ORG, folder.id, { principalId: 'e1', accessLevel: 'read' });
    expect(readGrant.permissions[0]?.accessLevel).toBe('read');
    const writeGrant = await engine.grantPermission(ORG, folder.id, { principalId: 'e2', accessLevel: 'write' });
    expect(writeGrant.permissions.some((p) => p.accessLevel === 'write')).toBe(true);
    const adminGrant = await engine.grantPermission(ORG, folder.id, { principalId: 'e3', accessLevel: 'admin' });
    expect(adminGrant.permissions.some((p) => p.accessLevel === 'admin')).toBe(true);
  });

  it('a folder can be created with neither a parent nor an owner', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Root' });
    expect(folder.parentFolderId).toBeUndefined();
    expect(folder.ownerId).toBeUndefined();
  });

  it('getDescendants() returns an empty array when the folder is archived but has children', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { name: 'Parent' });
    await engine.create(ORG, { name: 'Child', parentFolderId: parent.id });
    await engine.archive(ORG, parent.id);
    expect(await engine.getDescendants(ORG, parent.id)).toHaveLength(1);
  });

  it('multiple sibling folders under the same parent are all returned by getChildren()', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { name: 'Parent' });
    await engine.create(ORG, { name: 'Child A', parentFolderId: parent.id });
    await engine.create(ORG, { name: 'Child B', parentFolderId: parent.id });
    expect(await engine.getChildren(ORG, parent.id)).toHaveLength(2);
  });

  it('update() with no fields leaves the folder name and owner unchanged', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Original', ownerId: 'e1' });
    const updated = await engine.update(ORG, folder.id, {});
    expect(updated.name).toBe('Original');
    expect(updated.ownerId).toBe('e1');
  });

  it('a deep hierarchy of four levels resolves ancestors correctly', async () => {
    const { engine } = setup();
    const level1 = await engine.create(ORG, { name: 'L1' });
    const level2 = await engine.create(ORG, { name: 'L2', parentFolderId: level1.id });
    const level3 = await engine.create(ORG, { name: 'L3', parentFolderId: level2.id });
    const level4 = await engine.create(ORG, { name: 'L4', parentFolderId: level3.id });
    const ancestors = await engine.getAncestors(ORG, level4.id);
    expect(ancestors.map((f) => f.id)).toEqual([level1.id, level2.id, level3.id]);
  });

  it('getDescendants() across three levels returns all of them, not just direct children', async () => {
    const { engine } = setup();
    const root = await engine.create(ORG, { name: 'Root' });
    const child = await engine.create(ORG, { name: 'Child', parentFolderId: root.id });
    const grandchild1 = await engine.create(ORG, { name: 'G1', parentFolderId: child.id });
    const grandchild2 = await engine.create(ORG, { name: 'G2', parentFolderId: child.id });
    const descendants = await engine.getDescendants(ORG, root.id);
    expect(descendants.map((f) => f.id).sort()).toEqual([child.id, grandchild1.id, grandchild2.id].sort());
  });

  it('folders belonging to different organizations never appear in getChildren()', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { name: 'Parent' });
    await engine.create('org-2', { name: 'Other Org Child', parentFolderId: parent.id });
    expect(await engine.getChildren(ORG, parent.id)).toEqual([]);
  });

  it('grantPermission() and revokePermission() together leave other principals untouched', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'X' });
    await engine.grantPermission(ORG, folder.id, { principalId: 'e1', accessLevel: 'read' });
    await engine.grantPermission(ORG, folder.id, { principalId: 'e2', accessLevel: 'write' });
    const updated = await engine.revokePermission(ORG, folder.id, 'e1');
    expect(updated.permissions).toEqual([{ principalId: 'e2', accessLevel: 'write' }]);
  });

  it('update() can change only the owner, leaving the name intact', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Contracts' });
    const updated = await engine.update(ORG, folder.id, { ownerId: 'employee-9' });
    expect(updated.name).toBe('Contracts');
    expect(updated.ownerId).toBe('employee-9');
  });

  it('list() returns an empty array for an organization with no folders', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('a folder can be re-archived and re-restored after multiple cycles', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'X' });
    await engine.archive(ORG, folder.id);
    await engine.restore(ORG, folder.id);
    await engine.archive(ORG, folder.id);
    const restored = await engine.restore(ORG, folder.id);
    expect(restored.status).toBe('active');
  });

  it('getChildren() never leaks across organizations', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { name: 'Parent' });
    const otherParent = await engine.create('org-2', { name: 'Parent' });
    await engine.create(ORG, { name: 'Child', parentFolderId: parent.id });
    await engine.create('org-2', { name: 'Child', parentFolderId: otherParent.id });
    expect(await engine.getChildren(ORG, parent.id)).toHaveLength(1);
  });

  it('folders may be renamed multiple times, each producing a fresh updatedAt', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'First' });
    const second = await engine.update(ORG, folder.id, { name: 'Second' });
    const third = await engine.update(ORG, second.id, { name: 'Third' });
    expect(third.name).toBe('Third');
  });

  it('a folder with an owner but no permissions is still fully queryable', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'X', ownerId: 'employee-1' });
    expect(await engine.get(ORG, folder.id)).toMatchObject({ ownerId: 'employee-1', permissions: [] });
  });

  it('grantPermission() on an archived folder still succeeds', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'X' });
    await engine.archive(ORG, folder.id);
    const updated = await engine.grantPermission(ORG, folder.id, { principalId: 'e1', accessLevel: 'read' });
    expect(updated.permissions).toHaveLength(1);
  });

  it('getAncestors() on a folder with a broken chain still resolves what it can before running out of parents', async () => {
    const { engine } = setup();
    const root = await engine.create(ORG, { name: 'Root' });
    const leaf = await engine.create(ORG, { name: 'Leaf', parentFolderId: root.id });
    expect(await engine.getAncestors(ORG, leaf.id)).toEqual([root]);
  });

  it('two independent folder trees within the same organization do not interfere', async () => {
    const { engine } = setup();
    const treeARoot = await engine.create(ORG, { name: 'Tree A' });
    const treeBRoot = await engine.create(ORG, { name: 'Tree B' });
    await engine.create(ORG, { name: 'A Child', parentFolderId: treeARoot.id });
    await engine.create(ORG, { name: 'B Child', parentFolderId: treeBRoot.id });
    expect(await engine.getChildren(ORG, treeARoot.id)).toHaveLength(1);
    expect(await engine.getChildren(ORG, treeBRoot.id)).toHaveLength(1);
  });

  it('grantPermission() with the same principal and access level twice is idempotent', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'X' });
    await engine.grantPermission(ORG, folder.id, { principalId: 'e1', accessLevel: 'read' });
    const again = await engine.grantPermission(ORG, folder.id, { principalId: 'e1', accessLevel: 'read' });
    expect(again.permissions).toEqual([{ principalId: 'e1', accessLevel: 'read' }]);
  });

  it('update() throws FolderNotFoundError for a folder belonging to a different organization', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'X' });
    await expect(engine.update('org-2', folder.id, { name: 'Y' })).rejects.toBeInstanceOf(FolderNotFoundError);
  });

  it('restore() throws FolderNotFoundError for an unknown folder', async () => {
    const { engine } = setup();
    await expect(engine.restore(ORG, 'missing')).rejects.toBeInstanceOf(FolderNotFoundError);
  });

  it('a folder created with only a name has every optional field undefined or empty', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'Minimal' });
    expect(folder.parentFolderId).toBeUndefined();
    expect(folder.ownerId).toBeUndefined();
    expect(folder.permissions).toEqual([]);
  });

  it('list() reflects folders across every status', async () => {
    const { engine } = setup();
    const active = await engine.create(ORG, { name: 'Active' });
    const archived = await engine.create(ORG, { name: 'Archived' });
    await engine.archive(ORG, archived.id);
    const all = await engine.list(ORG);
    expect(all.map((f) => f.id).sort()).toEqual([active.id, archived.id].sort());
  });

  it('access levels read, write, and admin are distinct, stable string values', () => {
    const levels = ['read', 'write', 'admin'];
    expect(new Set(levels).size).toBe(3);
  });

  it('getChildren() on a folder with no id match returns an empty array rather than throwing', async () => {
    const { engine } = setup();
    expect(await engine.getChildren(ORG, 'nonexistent-folder-id')).toEqual([]);
  });

  it('a folder’s permissions array is empty by default and only grows via grantPermission()', async () => {
    const { engine } = setup();
    const folder = await engine.create(ORG, { name: 'X' });
    expect(folder.permissions).toHaveLength(0);
    const withOne = await engine.grantPermission(ORG, folder.id, { principalId: 'e1', accessLevel: 'read' });
    expect(withOne.permissions).toHaveLength(1);
  });
});
