import { Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { projects } from '@/lib/platform';
import type { Project } from '@/lib/platform/types';

const columns: DataTableColumn<Project>[] = [
  { key: 'code', header: 'Code', render: (project) => project.code },
  { key: 'name', header: 'Name', render: (project) => project.name },
  { key: 'startDate', header: 'Start', render: (project) => project.startDate ?? '—' },
  {
    key: 'status',
    header: 'Status',
    render: (project) => <Badge variant="outline">{project.status}</Badge>,
  },
];

export default async function ProjectsPage() {
  const { projects: rows, total } = await projects.listProjects({ limit: 50 });

  return (
    <div>
      <PageHeader title="Projects" description={`${total} project${total === 1 ? '' : 's'}.`} />
      {rows.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No projects yet"
          description="Projects created through the Project Management engine will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(project) => project.id}
          getRowHref={(project) => `/projects/${project.id}`}
        />
      )}
    </div>
  );
}
