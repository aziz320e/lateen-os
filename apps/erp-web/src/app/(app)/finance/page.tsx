import { Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { finance } from '@/lib/platform';
import type { ARInvoice } from '@/lib/platform/types';

const columns: DataTableColumn<ARInvoice>[] = [
  {
    key: 'invoiceNumber',
    header: 'Invoice',
    render: (invoice) => invoice.invoiceNumber ?? invoice.id,
  },
  { key: 'total', header: 'Total', render: (invoice) => `${invoice.total} ${invoice.currency}` },
  {
    key: 'balanceDue',
    header: 'Balance Due',
    render: (invoice) => `${invoice.balanceDue} ${invoice.currency}`,
  },
  {
    key: 'status',
    header: 'Status',
    render: (invoice) => <Badge variant="outline">{invoice.status}</Badge>,
  },
];

export default async function FinancePage() {
  const { invoices, total } = await finance.listInvoices({ limit: 50 });

  return (
    <div>
      <PageHeader
        title="Finance"
        description={`${total} invoice${total === 1 ? '' : 's'} on file.`}
      />
      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Invoices created through the Finance engine will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={invoices}
          getRowId={(invoice) => invoice.id}
          getRowHref={(invoice) => `/finance/${invoice.id}`}
        />
      )}
    </div>
  );
}
