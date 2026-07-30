import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { documents } from '@/lib/platform';
import type { DocumentRecord } from '@/lib/platform/types';

const columns: DataTableColumn<DocumentRecord>[] = [
  { key: 'title', header: 'Title', render: (document) => document.title },
  { key: 'documentType', header: 'Type', render: (document) => document.documentType },
  {
    key: 'currentVersionNumber',
    header: 'Version',
    render: (document) => `v${document.currentVersionNumber}`,
  },
  {
    key: 'status',
    header: 'Status',
    render: (document) => <Badge variant="outline">{document.status}</Badge>,
  },
];

export default async function DocumentsPage() {
  const { documents: rows, total } = await documents.listDocuments({ limit: 50 });

  return (
    <div>
      <PageHeader title="Documents" description={`${total} document${total === 1 ? '' : 's'}.`} />
      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Documents created through the Document Management engine will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(document) => document.id}
          getRowHref={(document) => `/documents/${document.id}`}
        />
      )}
    </div>
  );
}
