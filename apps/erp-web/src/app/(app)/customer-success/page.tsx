import { HeartHandshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { customerSuccess } from '@/lib/platform';
import type { CustomerSuccessRecord } from '@/lib/platform/types';

const columns: DataTableColumn<CustomerSuccessRecord>[] = [
  { key: 'id', header: 'Record', render: (record) => record.id },
  { key: 'customerId', header: 'Customer', render: (record) => record.customerId },
  {
    key: 'status',
    header: 'Status',
    render: (record) => <Badge variant="outline">{record.status}</Badge>,
  },
];

export default async function CustomerSuccessPage() {
  const { records, total } = await customerSuccess.listCustomerSuccessRecords({ limit: 50 });

  return (
    <div>
      <PageHeader
        title="Customer Success"
        description={`${total} record${total === 1 ? '' : 's'}.`}
      />
      {records.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="No customer success records yet"
          description="Records created through the Customer Success engine will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={records}
          getRowId={(record) => record.id}
          getRowHref={(record) => `/customer-success/${record.id}`}
        />
      )}
    </div>
  );
}
