import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { crm } from '@/lib/platform';
import type { Customer } from '@/lib/platform/types';

const columns: DataTableColumn<Customer>[] = [
  { key: 'name', header: 'Name', render: (customer) => customer.name },
  { key: 'company', header: 'Company', render: (customer) => customer.company ?? '—' },
  { key: 'email', header: 'Email', render: (customer) => customer.email ?? '—' },
  {
    key: 'status',
    header: 'Status',
    render: (customer) => (
      <Badge variant={customer.status === 'active' ? 'success' : 'outline'}>
        {customer.status}
      </Badge>
    ),
  },
];

/**
 * Real data only: this list is exactly what `apps/backend`'s
 * `GET /api/v1/crm/customers` reports right now, which itself reads
 * through the real, hosted `crm-engine` runtime's own query layer. An
 * organization with nothing created yet returns zero customers — the
 * empty state below, not fabricated rows.
 */
export default async function CrmPage() {
  const { customers, total } = await crm.listCustomers({ limit: 50 });

  return (
    <div>
      <PageHeader
        title="CRM"
        description={`${total} customer${total === 1 ? '' : 's'} in this organization.`}
      />
      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Customers created through the CRM engine will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={customers}
          getRowId={(customer) => customer.id}
          getRowHref={(customer) => `/crm/${customer.id}`}
        />
      )}
    </div>
  );
}
