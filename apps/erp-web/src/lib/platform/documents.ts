/** Documents adapter — calls `apps/backend`'s real `/api/v1/documents/*` REST API exclusively through `src/lib/api/client.ts`. */
import { apiGet, apiGetPaged } from '../api/client';
import type { DocumentRecord } from './types';

export async function listDocuments(
  params: { limit?: number; offset?: number } = {},
): Promise<{ documents: readonly DocumentRecord[]; total: number }> {
  const page = await apiGetPaged<DocumentRecord>('/api/v1/documents', params);
  return { documents: page.data, total: page.meta.total };
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  return apiGet<DocumentRecord | null>(`/api/v1/documents/${id}`);
}

export async function getDocumentsSummary(): Promise<{
  documentCount: number;
  folderCount: number;
}> {
  const [documents, folders] = await Promise.all([
    apiGetPaged<DocumentRecord>('/api/v1/documents', { limit: 1 }),
    apiGetPaged<unknown>('/api/v1/documents/folders', { limit: 1 }),
  ]);
  return { documentCount: documents.meta.total, folderCount: folders.meta.total };
}
