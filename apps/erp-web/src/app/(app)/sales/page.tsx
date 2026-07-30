import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { sales } from '@/lib/platform';
import type { SalesOpportunity } from '@/lib/platform/types';

const columns: DataTableColumn<SalesOpportunity>[] = [
  { key: 'name', header: 'Opportunity', render: (opportunity) => opportunity.name },
  {
    key: 'stage',
    header: 'Stage',
    render: (opportunity) => <Badge variant="outline">{opportunity.stage}</Badge>,
  },
  { key: 'amount', header: 'Amount', render: (opportunity) => opportunity.amount ?? '—' },
  {
    key: 'status',
    header: 'Status',
    render: (opportunity) => (
      <Badge variant={opportunity.status === 'active' ? 'success' : 'outline'}>
        {opportunity.status}
      </Badge>
    ),
  },
];

export default async function SalesPage() {
  const { opportunities, total } = await sales.listOpportunities({ limit: 50 });

  return (
    <div>
      <PageHeader
        title="Sales"
        description={`${total} opportunit${total === 1 ? 'y' : 'ies'} in the pipeline.`}
      />
      {opportunities.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No opportunities yet"
          description="Opportunities created through the Sales engine will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={opportunities}
          getRowId={(opportunity) => opportunity.id}
          getRowHref={(opportunity) => `/sales/${opportunity.id}`}
        />
      )}
    </div>
  );
}
