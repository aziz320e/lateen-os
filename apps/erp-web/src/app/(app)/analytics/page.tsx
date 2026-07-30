import { BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { analytics } from '@/lib/platform';
import type { Dashboard } from '@/lib/platform/types';

const columns: DataTableColumn<Dashboard>[] = [
  { key: 'name', header: 'Dashboard', render: (dashboard) => dashboard.name },
  {
    key: 'dashboardType',
    header: 'Type',
    render: (dashboard) => <Badge variant="outline">{dashboard.dashboardType}</Badge>,
  },
  { key: 'widgets', header: 'Widgets', render: (dashboard) => dashboard.widgets.length },
];

export default async function AnalyticsPage() {
  const { dashboards, total } = await analytics.listDashboards({ limit: 50 });

  return (
    <div>
      <PageHeader title="Analytics" description={`${total} dashboard${total === 1 ? '' : 's'}.`} />
      {dashboards.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No dashboards yet"
          description="Dashboards created through the Analytics engine will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={dashboards}
          getRowId={(dashboard) => dashboard.id}
          getRowHref={(dashboard) => `/analytics/${dashboard.id}`}
        />
      )}
    </div>
  );
}
