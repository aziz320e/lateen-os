import { UsersRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { hr } from '@/lib/platform';
import type { Employee } from '@/lib/platform/types';

const columns: DataTableColumn<Employee>[] = [
  { key: 'employeeNumber', header: 'Employee #', render: (employee) => employee.employeeNumber },
  {
    key: 'name',
    header: 'Name',
    render: (employee) => `${employee.firstName} ${employee.lastName}`,
  },
  { key: 'email', header: 'Email', render: (employee) => employee.email },
  {
    key: 'status',
    header: 'Status',
    render: (employee) => (
      <Badge variant={employee.employmentStatus === 'active' ? 'success' : 'outline'}>
        {employee.employmentStatus}
      </Badge>
    ),
  },
];

export default async function HrPage() {
  const { employees, total } = await hr.listEmployees({ limit: 50 });

  return (
    <div>
      <PageHeader title="HR" description={`${total} employee${total === 1 ? '' : 's'}.`} />
      {employees.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No employees yet"
          description="Employees created through the HR engine will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={employees}
          getRowId={(employee) => employee.id}
          getRowHref={(employee) => `/hr/${employee.id}`}
        />
      )}
    </div>
  );
}
